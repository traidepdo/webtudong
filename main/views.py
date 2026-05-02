from django.shortcuts import render
from rest_framework import viewsets, generics, permissions, filters
from .models import Category, Product, ProductVariant, Order, Color, Size, ProductImage
from .serializers import CategorySerializer, ProductSerializer, ProductVariantSerializer, OrderSerializer, UserSerializer, RegisterSerializer, ColorSerializer, SizeSerializer, ProductImageSerializer
from django.contrib.auth.models import User
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from rest_framework.decorators import api_view,permission_classes 
import anthropic
from rest_framework.permissions import AllowAny

def home(request):
    return render(request, 'main/home.html')
class ColorViewSet(viewsets.ModelViewSet):
    queryset = Color.objects.all()
    serializer_class = ColorSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class SizeViewSet(viewsets.ModelViewSet):
    queryset = Size.objects.all()
    serializer_class = SizeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
# ==========================================
# API GIAO DỊCH SẢN PHẨM & DANH MỤC
# ==========================================
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    # Khách vãng lai chỉ được GET. Muốn POST/PUT/DELETE phải là Admin (IsAdminUser)
    # Tuy nhiên DRF cung cấp IsAuthenticatedOrReadOnly rất tiện cho e-commerce cơ bản
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] 

class ProductViewSet(viewsets.ModelViewSet):
    # Dùng prefetch_related để tối ưu hóa truy vấn Database (chống lỗi N+1 Query)
    queryset = Product.objects.all().prefetch_related('variants', 'images')
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
# ==========================================
# API ĐƠN HÀNG
# ==========================================
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    # Bắt buộc phải đăng nhập mới được thao tác với Đơn hàng
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Admin thì thấy toàn bộ đơn hàng của hệ thống
        if self.request.user.is_staff:
            return Order.objects.all()
        # Khách hàng thường thì CHỈ THẤY ĐƠN HÀNG CỦA CHÍNH MÌNH
        return Order.objects.filter(user=self.request.user)

# ==========================================
# API TÀI KHOẢN (AUTH)
# ==========================================
class RegisterView(generics.CreateAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        # Trả về đúng user đang call API thông qua Token/Session
        return self.request.user

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminStatsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        total_orders = Order.objects.count()
        total_revenue = Order.objects.filter(status='delivered').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_users = User.objects.count()

        return Response({
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'total_users': total_users
        })
@api_view(['GET'])
def related_products(request, slug):
    try:
        current_product = Product.objects.get(slug=slug)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    all_products = list(
        Product.objects.exclude(slug=slug).prefetch_related('variants', 'images')
    )

    if not all_products:
        return Response([])

    def build_text(p):
        parts = [p.name or "", p.category.name if p.category else "", p.description or ""]
        return " ".join(parts).lower()

    current_text = build_text(current_product)
    all_texts = [build_text(p) for p in all_products]

    corpus = [current_text] + all_texts
    vectorizer = TfidfVectorizer(analyzer='word', ngram_range=(1, 2))
    tfidf_matrix = vectorizer.fit_transform(corpus)

    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    # Sort tất cả theo similarity giảm dần
    sorted_indices = np.argsort(similarities)[::-1]

    # Lấy top 4 — bất kể similarity = 0 cũng lấy
    # (nếu không đủ 4 sản phẩm trong DB thì lấy hết)
    top_4 = [all_products[i] for i in sorted_indices[:4]]

    serializer = ProductSerializer(top_4, many=True, context={'request': request})
    return Response(serializer.data)
