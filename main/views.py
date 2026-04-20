from django.shortcuts import render
from rest_framework import viewsets, generics, permissions, filters
from .models import Category, Product, ProductVariant, Order
from .serializers import CategorySerializer, ProductSerializer, ProductVariantSerializer, OrderSerializer, UserSerializer, RegisterSerializer

def home(request):
    return render(request, 'main/home.html')

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

class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
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