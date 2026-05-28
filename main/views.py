from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, generics, permissions, filters
from .models import Category, Product, ProductVariant, Order, Color, Size, ProductImage, ChatMessage, OrderItem, Review, Brand, BlogPost, BlogCategory, BlogComment, Notification
from .serializers import CategorySerializer, ProductSerializer, ProductVariantSerializer, OrderSerializer, UserSerializer, RegisterSerializer, ColorSerializer, SizeSerializer, ProductImageSerializer, ReviewSerializer, BrandSerializer, BlogPostListSerializer, BlogPostDetailSerializer, BlogCommentSerializer, BlogCategorySerializer, NotificationSerializer
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
import re
from django_filters.rest_framework import DjangoFilterBackend

from langchain_ollama import OllamaLLM
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .models import ChatMessage
import json



from django.http import HttpResponse

def home(request):
    return render(request, 'main/home.html')

def robots_txt(request):
    content = """User-agent: *
Disallow: /admin/
Disallow: /api/

Sitemap: http://%s/sitemap.xml
""" % request.get_host()
    return HttpResponse(content, content_type="text/plain")
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
        if self.request.user.is_staff:
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def recent(self, request):
        orders = self.get_queryset()[:5]
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

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
        pending_orders = Order.objects.filter(status='pending').count()

        return Response({
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'total_users': total_users,
            'pending_orders': pending_orders
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

# from langchain_ollama import OllamaLLM
# from langchain_core.prompts import PromptTemplate
# from langchain_core.output_parsers import StrOutputParser
# from .models import ChatMessage

llm = OllamaLLM(model="qwen2.5:3b", temperature=0.0)

# ===== TOOLS CHO AI =====
def search_products(keyword="", category="", min_price=None, max_price=None):
    """Tìm sản phẩm từ DB"""
    from django.db.models import Q
    qs = Product.objects.prefetch_related('variants', 'images').all()
    # Dùng OR để tìm theo tên SẢN PHẨM hoặc tên DANH MỤC — tránh bỏ sót kết quả
    if keyword:
        qs = qs.filter(Q(name__icontains=keyword) | Q(category__name__icontains=keyword))
    elif category:
        qs = qs.filter(category__name__icontains=category)
    
    results = []
    # ĐỪNG dùng qs[:5] ở đây, cứ lặp hết
    for p in qs:
        primary_img = p.images.filter(is_primary=True).first()
        p_min_price = min([float(v.price) for v in p.variants.all()], default=0)
        
        # Kiểm tra điều kiện giá
        if max_price and p_min_price > float(max_price):
            continue
        if min_price and p_min_price < float(min_price):
            continue
            
        results.append({
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "category": p.category.name if p.category else "",
            "min_price": p_min_price,
            "image": primary_img.image.url if primary_img else "",
            "variants": [
                {
                    "id": v.id,
                    "color": v.color.name,
                    "size": v.size.name,
                    "price": float(v.price),
                    "stock": v.stock_quantity
                }
                for v in p.variants.select_related('color', 'size').all()
            ]
        })
        
        # Đủ 5 sản phẩm thỏa mãn thì mới dừng
        if len(results) >= 5:
            break
            
    return results

def get_product_detail(slug):
    """Lấy chi tiết 1 sản phẩm"""
    try:
        p = Product.objects.prefetch_related('variants__color', 'variants__size', 'images').get(slug=slug)
        return {
            "name": p.name,
            "slug": p.slug,
            "description": p.description,
            "category": p.category.name if p.category else "",
            "variants": [
                {
                    "id": v.id,
                    "color": v.color.name,
                    "size": v.size.name,
                    "price": float(v.price),
                    "stock": v.stock_quantity,
                    "sku": v.sku
                }
                for v in p.variants.select_related('color', 'size').all()
            ]
        }
    except Product.DoesNotExist:
        return None

def create_order(user_id, variant_id, quantity, full_name, phone, address):
    """Tạo đơn hàng"""
    try:
        variant = ProductVariant.objects.select_related('product').get(id=variant_id)
        if variant.stock_quantity < quantity:
            return {"success": False, "error": f"Chỉ còn {variant.stock_quantity} sản phẩm"}
        
        total = float(variant.price) * quantity
        from django.contrib.auth.models import User
        user = User.objects.get(id=user_id) if user_id else None
        
        order = Order.objects.create(
            user=user,
            full_name=full_name,
            phone_number=phone,
            shipping_address=address,
            total_amount=total,
            status='pending'
        )
        OrderItem.objects.create(
            order=order,
            variant=variant,
            quantity=quantity,
            price=variant.price
        )
        return {
            "success": True,
            "order_id": order.id,
            "total": total,
            "product": variant.product.name,
            "color": variant.color.name,
            "size": variant.size.name
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ===== PARSE INTENT TỪ AI =====
def parse_ai_response(raw_response):
    """
    Trích xuất JSON từ response của AI.
    """
    try:
        start = raw_response.find('{')
        end = raw_response.rfind('}') + 1
        if start != -1 and end > start:
            json_str = raw_response[start:end]
            return json.loads(json_str)
    except: 
        pass
    return {"reply": raw_response.strip(), "action": "none", "data": {}}
def detect_navigate(user_message):
    """Detect điều hướng từ tin nhắn user — không dùng AI"""
    text = user_message.lower().strip()

    # BỎ 'danh mục', 'danh sách' ra khỏi đây để nhường đất diễn cho việc tìm kiếm Category
    rules = [
        (['/login', 'đăng nhập', 'login'], '/login'),
        (['/cart', 'giỏ hàng', 'cart'], '/cart'),
        (['/checkout', 'thanh toán', 'checkout'], '/checkout'),
        (['/products', 'tất cả sản phẩm', 'xem tất cả', 'tất cả'], '/products'), # Đã sửa dòng này
        (['trang chủ', 'home', 'về nhà', 'trang đầu', 'đầu trang'], '/'),
    ]

    for keywords, path in rules:
        if any(kw in text for kw in keywords):
            return path
    return None
import re

def detect_search_intent(user_message):
    """Detect từ khóa và giá tiền từ tin nhắn"""
    text = user_message.lower()

    # --- Loại bỏ sớm: câu hỏi tư vấn size/cân nặng/chiều cao KHÔNG phải tìm kiếm sản phẩm ---
    size_advice_patterns = [
        r'\d+\s*kg', r'\d+\s*cm', r'cân nặng', r'chiều cao',
        r'nên mặc size', r'nên chọn size', r'size nào', r'size bao nhiêu',
        r'mặc size gì', r'chọn size gì', r'body', r'dáng người'
    ]
    if any(re.search(p, text) for p in size_advice_patterns):
        return None, None, None, None

    min_price = None
    max_price = None

    # Bắt chữ "dưới/trên" + số tiền — chỉ khi có đơn vị tiền rõ ràng (k, đ, đồng, 000)
    price_match = re.search(r'(dưới|trên|rẻ hơn|đắt hơn)\s*(\d+)(k|\.000|,000|000|đ|đồng)', text)
    if price_match:
        condition = price_match.group(1)
        num = int(price_match.group(2))
        unit = price_match.group(3)

        if unit == 'k' or num < 1000:
            price_val = num * 1000
        else:
            price_val = num

        if condition in ['dưới', 'rẻ hơn']:
            max_price = price_val
        elif condition in ['trên', 'đắt hơn']:
            min_price = price_val

    # Tìm keyword sản phẩm — "có" bị bỏ khỏi trigger vì quá chung chung
    keyword = None
    search_triggers = ['tìm', 'tìm kiếm', 'muốn xem', 'gợi ý', 'liên quan', 'giống', 'show', 'xem thử']
    price_triggers = ['dưới', 'trên', 'rẻ hơn', 'đắt hơn']
    if any(t in text for t in search_triggers) or (min_price or max_price):
        categories = ['váy', 'chân váy', 'áo', 'quần', 'đầm', 'vest', 'văn phòng', 'công sở']
        for cat in categories:
            if cat in text:
                keyword = cat
                break

    return keyword, None, min_price, max_price
@api_view(['POST'])
@permission_classes([AllowAny])
def submit_checkout(request):
    data = request.data

    user_id = request.user.id if request.user.is_authenticated else None
    product_slug = data.get('product_slug')
    color_name = data.get('color')
    size_name = data.get('size')
    quantity = int(data.get('quantity', 1))
    full_name = data.get('full_name')
    phone = data.get('phone')
    address = data.get('address')
    payment_method = data.get('payment_method', 'cod')  # ← THÊM DÒNG NÀY

    try:
        variant = ProductVariant.objects.get(
            product__slug=product_slug,
            color__name__iexact=color_name,
            size__name__iexact=size_name
        )

        result = create_order(
            user_id=user_id,
            variant_id=variant.id,
            quantity=quantity,
            full_name=full_name,
            phone=phone,
            address=address
        )

        if result.get("success"):
            # ← THÊM: Tạo Payment sau khi đặt hàng thành công
            from .models import Payment
            Payment.objects.create(
                order_id=result['order_id'],
                method=payment_method,
                amount=result['total']
            )
            method_labels = {
                'cod': 'Thanh toán khi nhận hàng',
                'vnpay': 'VNPay',
                'momo': 'Ví MoMo',
                'stripe': 'Thẻ tín dụng'
            }
            return Response({
                "message": f"Đặt hàng thành công! Mã đơn: #{result['order_id']}. "
                           f"Tổng tiền: {result['total']:,.0f}đ. "
                           f"Phương thức: {method_labels.get(payment_method, payment_method)}",
                "status": "success"
            })
        else:
            return Response({"error": result.get("error")}, status=400)

    except ProductVariant.DoesNotExist:
        return Response({"error": "Sản phẩm không có màu/size này hoặc đã hết hàng."}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
@api_view(['GET'])
@permission_classes([AllowAny])
def chat_history(request):
    session_id = request.query_params.get('session_id')
    if not session_id:
        return Response([])
    
    messages = ChatMessage.objects.filter(session_id=session_id).order_by('created_at')
    data = []
    for m in messages:
        data.append({
            "role": "assistant" if m.role == "bot" else "user",
            "content": m.content,
            "action": "none"
        })
    return Response(data)

@api_view(['POST'])
@permission_classes([AllowAny])
def product_chat(request):
    user_message = request.data.get('message', '').strip()
    session_id = request.data.get('session_id', 'default')
    slug = request.data.get('slug', '')  # slug sản phẩm đang xem
    path_name = request.data.get('path_name', '') # <--- ĐỌC VỊ TRÍ TRANG CỦA KHÁCH
    user_id = request.data.get('user_id')

    if not user_message:
        return Response({"error": "Tin nhắn không được để trống"}, status=400)

    # BẮT BUỘC ĐĂNG NHẬP TRƯỚC KHI CHAT BẤT CỨ GÌ
    if not user_id:
        reply = "Bạn vui lòng đăng nhập tài khoản để trò chuyện và được hỗ trợ tốt nhất nhé! 🚀"
        ChatMessage.objects.bulk_create([
            ChatMessage(session_id=session_id, role='user', content=user_message),
            ChatMessage(session_id=session_id, role='bot', content=reply)
        ])
        return Response({
            "reply": reply,
            "action": "navigate",
            "data": {"path": "/login"}
        })

    # ==================== 0. FAST-PATH: Câu ngắn xác nhận / xem sản phẩm ====================
    msg_lower = user_message.strip().lower()
    show_products_triggers = [
        'có', 'ừ', 'ok', 'oke', 'được', 'muốn', 'cho xem', 'xem đi',
        'xem các sản phẩm', 'xem sản phẩm', 'show products',
        'xem thêm', 'cho tôi xem', 'cho mình xem', 'gợi ý đi',
    ]
    if msg_lower in show_products_triggers:
        all_products = search_products(keyword="", category="", min_price=None, max_price=None)
        reply_text = "Dạ, đây là một số sản phẩm của Blue Sky Fashion nhé! 🛍️"
        ChatMessage.objects.bulk_create([
            ChatMessage(session_id=session_id, role='user', content=user_message),
            ChatMessage(session_id=session_id, role='bot', content=reply_text)
        ])
        return Response({
            "reply": reply_text,
            "action": "show_products",
            "data": {"products": (all_products or [])[:5]}
        })

    # ==================== 1. DETECT NHANH ====================
    nav_path = detect_navigate(user_message)
    if nav_path:
        reply = f"Đang chuyển bạn đến trang {nav_path} nhé! 🚀"
        ChatMessage.objects.bulk_create([
            ChatMessage(session_id=session_id, role='user', content=user_message),
            ChatMessage(session_id=session_id, role='bot', content=reply)
        ])
        return Response({
            "reply": reply,
            "action": "navigate",
            "data": {"path": nav_path}
        })

    # ==================== 2. LẤY CONTEXT SẢN PHẨM ====================
    # ==================== 2. LẤY CONTEXT SẢN PHẨM ====================
    keyword, category, min_price, max_price = detect_search_intent(user_message)
    products_context = ""
    found_products = []

    # Chỉ search khi có keyword hoặc lọc giá rõ ràng — tránh spam sản phẩm vào mọi câu hỏi
    if keyword or category or min_price or max_price:
        found_products = search_products(keyword=keyword, category=category, min_price=min_price, max_price=max_price)

        if not found_products and (min_price or max_price):
            found_products = search_products(keyword="", category="", min_price=min_price, max_price=max_price)

        if found_products:
            lines = []
            for p in found_products[:6]:
                variants_str = ", ".join([
                    f"{v['color']}/{v['size']} {v['price']:,.0f}đ"
                    for v in p['variants'][:4]
                ])
                lines.append(f"• {p['name']} | {variants_str} | /product/{p['slug']}")
            products_context = "Sản phẩm tìm thấy:\n" + "\n".join(lines)
        else:
            products_context = "Không có sản phẩm nào phù hợp với yêu cầu của bạn."

    # Thông tin sản phẩm đang xem
    product_info = ""
    current_product = None
    if slug:
        current_product = get_product_detail(slug)
        if current_product:
            variants_str = ", ".join([
                f"{v['color']}/{v['size']}: {v['price']:,.0f}đ" 
                for v in current_product['variants']
            ])
            product_info = f"Sản phẩm đang xem: {current_product['name']} | {variants_str}"

    # 👇 LOGIC NHẬN DIỆN VỊ TRÍ TRANG 👇
    current_page_info = "Khách đang dạo quanh website."
    if path_name == '/':
        current_page_info = "Khách đang ở Trang chủ."
    elif '/products' in path_name:
        current_page_info = "Khách đang ở trang Danh sách tất cả sản phẩm."
    elif '/cart' in path_name:
        current_page_info = "Khách đang ở trong Giỏ hàng."
    elif '/checkout' in path_name:
        current_page_info = "Khách đang ở trang Thanh toán."
    elif slug and current_product:
        current_page_info = f"Khách đang xem chi tiết sản phẩm: {current_product['name']}. (Nếu khách hỏi giá hoặc nói đặt hàng, hãy ưu tiên sản phẩm này!)"
    elif slug and not current_product:
        current_page_info = "Khách đang xem một sản phẩm (không tìm thấy chi tiết)."

    # Lấy thông tin màu/size/số lượng khách ĐÃ CHỌN trên giao diện web
    selected_color = request.data.get('selected_color')
    selected_size = request.data.get('selected_size')
    selected_quantity = request.data.get('selected_quantity')
    if selected_color or selected_size:
        current_page_info += f"\nKhách đang chọn trên giao diện: Màu [{selected_color or 'chưa chọn'}], Size [{selected_size or 'chưa chọn'}], Số lượng [{selected_quantity or 1}]."
    
    # Detect tin nhắn chào hỏi ngắn → không truyền history để AI không bị nhiễm context cũ
    greeting_patterns = [
        r'^(hello|hi|hey|xin chào|chào|alo|ê|ơi|có ai không|bot ơi|bạn ơi)\s*[!?.]*$',
        r'^(ok|oke|okay|được|thôi|cảm ơn|thanks|thank you|camon)\s*[!?.]*$',
    ]
    is_greeting = any(re.match(p, user_message.strip().lower()) for p in greeting_patterns)

    if is_greeting:
        history_text = "Chưa có lịch sử."  # Reset context khi chào hỏi, tránh AI bị nhiễm
    else:
        history_qs = ChatMessage.objects.filter(session_id=session_id).order_by('-created_at')[:6]
        history_list = list(reversed(history_qs))
        history_text = "\n".join([f"{'Khách' if m.role == 'user' else 'Trợ lý'}: {m.content}" for m in history_list]) or "Chưa có lịch sử."

    # ==================== 3. PROMPT TỐI ƯU ====================
    template = """Bạn là trợ lý bán hàng AI của Blue Sky Fashion. Bạn PHẢI trả lời bằng JSON hợp lệ, không chứa văn bản dư thừa bên ngoài.
Luôn trả lời bằng Tiếng Việt thân thiện.

=== VỊ TRÍ CỦA KHÁCH ===
{current_page_info}

=== SẢN PHẨM ===
{product_info}
{products_context}

=== LỊCH SỬ CHAT ===
{history}

=== TIN NHẮN CỦA KHÁCH ===
{user_message}

=== ĐỊNH DẠNG JSON BẮT BUỘC ===
{{
    "reply": "Câu trả lời của bạn (dưới 80 từ)",
    "action": "none" | "navigate" | "show_order_form" | "auto_order" | "show_products",
    "data": {{
        "path": "đường dẫn (nếu action=navigate)",
        "product_slug": "slug sản phẩm",
        "color": "màu sắc (nếu khách yêu cầu)",
        "size": "kích thước (nếu khách yêu cầu)",
        "quantity": 1,
        "full_name": "tên khách",
        "phone": "số điện thoại",
        "address": "địa chỉ giao hàng"
    }}
}}

LƯU Ý QUAN TRỌNG:
1. Nếu khách hỏi sản phẩm chung chung, dùng action "show_products".
2. Nếu khách muốn xem chi tiết, dùng action "navigate" và điền "path" dạng "/product/slug-san-pham".
3. Nếu khách muốn mua/đặt hàng (dù chỉ nói "mua", "đặt", "order", "chốt"), LUÔN dùng action "show_order_form" ngay cả khi khách chưa cung cấp màu/size — backend sẽ tự điền danh sách lựa chọn. Điền "product_slug" phù hợp vào data.
4. Nếu khách ĐÃ CUNG CẤP ĐỦ thông tin (màu, size, tên, sđt, địa chỉ), dùng action "auto_order" và điền đầy đủ các trường vào "data".
5. Nếu khách hỏi về cân nặng/chiều cao/dáng người/nên mặc size nào: trả lời tư vấn trực tiếp trong "reply" với bảng size phổ thông (S≤50kg, M=50-58kg, L=58-68kg, XL≥68kg), dùng action "none". KHÔNG tìm sản phẩm khi khách hỏi về size.
6. Không được trả action "none" khi khách rõ ràng muốn mua hàng.
7. QUAN TRỌNG: Luôn trả lời đúng theo NỘI DUNG TIN NHẮN HIỆN TẠI. Nếu khách chào hỏi (hello, xin chào, hi...) thì chỉ cần chào lại thân thiện, KHÔNG được tiếp tục chủ đề từ lịch sử trước đó. Lịch sử chat chỉ dùng để hiểu ngữ cảnh khi cần thiết, không được ưu tiên hơn tin nhắn hiện tại.
8. TUYỆT ĐỐI KHÔNG lặp lại câu trả lời trước đó. Mỗi tin nhắn phải có nội dung mới hoàn toàn.
9. Nếu khách nói "có", "ừ", "ok", "muốn xem" sau khi bạn hỏi "Bạn có muốn xem sản phẩm không?" → dùng action "show_products", không hỏi lại và không lặp câu tư vấn size."""

    # ==================== GỌI AI VÀ PARSE RESPONSE ====================
    try:
        prompt = PromptTemplate.from_template(template)
        chain = prompt | llm | StrOutputParser()

        raw_response = chain.invoke({
            "current_page_info": current_page_info,
            "product_info": product_info,
            "products_context": products_context,
            "history": history_text,
            "user_message": user_message,
        })

        parsed = parse_ai_response(raw_response)
        bot_response = parsed.get("reply", "Xin lỗi, mình chưa hiểu ý bạn. Bạn thử hỏi lại nhé!")
        action = parsed.get("action", "none")
        action_data = parsed.get("data", {})

        # Nếu action là show_products, gắn danh sách sản phẩm tìm được vào data
        if action == "show_products" and found_products:
            action_data["products"] = found_products

        # Nếu AI quyết định show_order_form mà thiếu slug, ta thử lấy slug hiện tại
        if action == "show_order_form":
            p_slug = action_data.get("product_slug")
            if not p_slug:
                p_slug = slug or (found_products[0]['slug'] if found_products else None)
                action_data["product_slug"] = p_slug

            if p_slug:
                try:
                    variants = ProductVariant.objects.filter(product__slug=p_slug).select_related('color', 'size', 'product')
                    action_data["available_colors"] = list(dict.fromkeys([v.color.name for v in variants if v.color]))
                    action_data["available_sizes"] = list(dict.fromkeys([v.size.name for v in variants if v.size]))
                    first_variant = variants.first()
                    if first_variant:
                        action_data["product_name"] = first_variant.product.name
                except:
                    pass

            if not action_data.get("color") and selected_color:
                action_data["color"] = selected_color
            if not action_data.get("size") and selected_size:
                action_data["size"] = selected_size
            if not action_data.get("quantity") and selected_quantity:
                action_data["quantity"] = selected_quantity

        # ==================== 4. XỬ LÝ AUTO ORDER ====================
        if action == "auto_order":
            p_slug = action_data.get("product_slug") or slug
            color = action_data.get("color")
            size = action_data.get("size")
            quantity = int(action_data.get("quantity", 1))
            name = action_data.get("full_name")
            phone = action_data.get("phone")
            addr = action_data.get("address")

            if p_slug and color and size and name and phone and addr:
                try:
                    variant = ProductVariant.objects.get(
                        product__slug=p_slug,
                        color__name__iexact=color,
                        size__name__iexact=size
                    )
                    res = create_order(user_id, variant.id, quantity, name, phone, addr)
                    if res.get("success"):
                        # Tạo Payment cho đơn hàng qua chat
                        from .models import Payment as PaymentModel
                        PaymentModel.objects.create(
                            order_id=res['order_id'],
                            method='cod',
                            amount=res['total']
                        )
                        bot_response = f"🎉 Đặt hàng thành công! Mã đơn của bạn là #{res['order_id']}. Cảm ơn bạn đã mua sắm!"
                        action = "none"
                    else:
                        bot_response = f"Xin lỗi, đặt hàng thất bại: {res.get('error')}"
                        action = "show_order_form"
                except ProductVariant.DoesNotExist:
                    bot_response = f"Xin lỗi, sản phẩm không có màu {color} và size {size}. Bạn vui lòng kiểm tra lại nhé."
                    action = "show_order_form"
            else:
                bot_response = "Hình như bạn còn thiếu một số thông tin (màu, size, sđt, địa chỉ). Bạn điền nốt vào form dưới đây nhé!"
                action = "show_order_form"

        # Bảo vệ bằng keyword regex: Nếu AI trả về none nhưng khách rõ ràng muốn mua/đặt hàng
        user_msg_lower = user_message.lower()
        order_keywords = ['mua', 'đặt', 'chốt đơn']
        if action not in ["show_order_form", "auto_order"] and any(kw in user_msg_lower for kw in order_keywords):
            action = "show_order_form"
            p_slug = action_data.get("product_slug") or slug or (found_products[0]['slug'] if found_products else None)
            action_data["product_slug"] = p_slug
            if p_slug:
                try:
                    variants = ProductVariant.objects.filter(product__slug=p_slug).select_related('color', 'size', 'product')
                    action_data["available_colors"] = list(dict.fromkeys([v.color.name for v in variants if v.color]))
                    action_data["available_sizes"] = list(dict.fromkeys([v.size.name for v in variants if v.size]))
                    first_variant = variants.first()
                    if first_variant:
                        action_data["product_name"] = first_variant.product.name
                except:
                    pass

            if selected_color: action_data["color"] = selected_color
            if selected_size: action_data["size"] = selected_size
            if selected_quantity: action_data["quantity"] = selected_quantity
            if "reply" not in parsed or not parsed["reply"]:
                bot_response = "Dạ vâng, mời bạn điền thông tin để mình lên đơn nhé! 🛒✨"

        # YÊU CẦU ĐĂNG NHẬP NẾU MUỐN ĐẶT HÀNG MÀ CHƯA CÓ USER_ID
        if action in ["show_order_form", "auto_order"] and not user_id:
            action = "navigate"
            action_data = {"path": "/login"}
            bot_response = "Bạn vui lòng đăng nhập tài khoản trước để mình hỗ trợ bạn lên đơn nhé! 🚀"

        ChatMessage.objects.bulk_create([
            ChatMessage(session_id=session_id, role='user', content=user_message),
            ChatMessage(session_id=session_id, role='bot', content=bot_response)
        ])

        return Response({
            "reply": bot_response,
            "action": action,
            "data": action_data
        })

    except Exception as e:
        print(f"Chat error: {e}")
        return Response({
            'reply': 'Xin lỗi, mình đang hơi bận. Bạn thử hỏi lại nhé! 🙏',
            'action': 'none',
            'data': {}
        }, status=500)

class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
 
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
 
    def get_queryset(self):
        product_slug = self.kwargs.get('slug')
        return Review.objects.filter(
            product__slug=product_slug
        ).select_related('user', 'user__profile')
 
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx
 
    def create(self, request, *args, **kwargs):
        product_slug = self.kwargs.get('slug')
        try:
            product = Product.objects.get(slug=product_slug)
        except Product.DoesNotExist:
            return Response({'detail': 'Sản phẩm không tồn tại.'}, status=status.HTTP_404_NOT_FOUND)
 
        # Inject product vào data
        data = request.data.copy()
        data['product'] = product.id
 
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
 
 
class ReviewEligibilityView(generics.GenericAPIView):
    """
    GET /products/<slug>/review-eligibility/
    Trả về: { can_review: bool, message: str, existing_review: {...} | null }
    """
    permission_classes = [permissions.IsAuthenticated]
 
    def get(self, request, slug):
        try:
            product = Product.objects.get(slug=slug)
        except Product.DoesNotExist:
            return Response({'detail': 'Không tìm thấy sản phẩm.'}, status=status.HTTP_404_NOT_FOUND)
 
        can_review, message = Review.user_can_review(request.user, product)
 
        existing = Review.objects.filter(user=request.user, product=product).first()
        existing_data = ReviewSerializer(existing, context={'request': request}).data if existing else None
 
        return Response({
            'can_review': can_review,
            'message': message,
            'existing_review': existing_data,
        })

class AllReviewsViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().select_related('user', 'product').order_by('-created_at')
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAdminUser]


class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Chỉ admin (is_staff) mới được POST/PUT/DELETE.
    Người dùng thường chỉ được GET.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
 
 
# ============================================================
# BLOG CATEGORY
# ============================================================
 
class BlogCategoryListView(generics.ListCreateAPIView):
    """
    GET  /api/blog/categories/       → Danh sách danh mục (public)
    POST /api/blog/categories/       → Tạo danh mục (admin only)
    """
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
 
 
# ============================================================
# BLOG POST — DANH SÁCH & TẠO MỚI
# ============================================================
 
class BlogPostListView(generics.ListCreateAPIView):
    """
    GET  /api/blog/posts/            → Danh sách bài viết đã đăng (public)
    POST /api/blog/posts/            → Tạo bài viết mới (admin only)
 
    Query params hỗ trợ:
      ?category=<slug>               → Lọc theo danh mục
      ?search=<từ khóa>              → Tìm theo tiêu đề
      ?status=draft|published        → Admin lọc theo trạng thái
    """
    serializer_class = BlogPostListSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'excerpt', 'content']
    ordering_fields = ['published_at', 'views', 'created_at']
    ordering = ['-published_at']
 
    def get_queryset(self):
        qs = BlogPost.objects.select_related('author', 'category')
 
        # Người thường chỉ thấy bài đã đăng
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(status='published')
 
        # Lọc theo category slug
        category_slug = self.request.query_params.get('category')
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
 
        return qs
 
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BlogPostDetailSerializer
        return BlogPostListSerializer
 
 
# ============================================================
# BLOG POST — CHI TIẾT, SỬA, XÓA
# ============================================================
 
class BlogPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/blog/posts/<slug>/   → Chi tiết bài viết + tăng view (public)
    PUT    /api/blog/posts/<slug>/   → Sửa bài viết (admin only)
    PATCH  /api/blog/posts/<slug>/   → Sửa một phần (admin only)
    DELETE /api/blog/posts/<slug>/   → Xóa bài viết (admin only)
    """
    serializer_class = BlogPostDetailSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
 
    def get_queryset(self):
        qs = BlogPost.objects.select_related('author', 'category').prefetch_related(
            'related_products', 'comments__user__profile'
        )
        # Admin thấy cả draft
        if self.request.user and self.request.user.is_staff:
            return qs
        return qs.filter(status='published')
 
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Tăng view mỗi lần có người đọc
        BlogPost.objects.filter(pk=instance.pk).update(views=instance.views + 1)
        instance.refresh_from_db(fields=['views'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
 
 
# ============================================================
# BLOG COMMENT
# ============================================================
 
class BlogCommentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/blog/posts/<slug>/comments/   → Danh sách comment của bài viết (public)
    POST /api/blog/posts/<slug>/comments/   → Đăng comment (phải đăng nhập)
    """
    serializer_class = BlogCommentSerializer
 
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
 
    def get_queryset(self):
        post = get_object_or_404(BlogPost, slug=self.kwargs['slug'], status='published')
        return BlogComment.objects.filter(post=post).select_related('user__profile')
 
    def perform_create(self, serializer):
        post = get_object_or_404(BlogPost, slug=self.kwargs['slug'], status='published')
        serializer.save(user=self.request.user, post=post)
 
 
class BlogCommentDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/blog/comments/<id>/   → Xóa comment (chủ comment hoặc admin)
    """
    serializer_class = BlogCommentSerializer
 
    def get_permissions(self):
        return [permissions.IsAuthenticated()]
 
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return BlogComment.objects.all()
        # Người dùng thường chỉ xóa được comment của mình
        return BlogComment.objects.filter(user=user)


# ==========================================
# API THÔNG BÁO (NOTIFICATION)
# ==========================================

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_unread_count(request):
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({'unread_count': count})


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def notification_mark_read(request, pk):
    try:
        notification = Notification.objects.get(pk=pk, user=request.user)
    except Notification.DoesNotExist:
        return Response({'error': 'Không tìm thấy thông báo'}, status=404)
    notification.is_read = True
    notification.save()
    return Response({'status': 'ok'})


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def notification_mark_all_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'status': 'ok'})