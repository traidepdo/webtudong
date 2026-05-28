from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

# ==========================================
# PHẦN 1: QUẢN LÝ SẢN PHẨM & BIẾN THỂ
# ==========================================

class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE,
        null=True, blank=True, related_name='subcategories'
    )
    # === FIX 1: Thêm các field hỗ trợ SEO ===
    meta_title = models.CharField(max_length=70, blank=True, help_text="Tiêu đề SEO (≤70 ký tự). Để trống = dùng name.")
    meta_description = models.CharField(max_length=160, blank=True, help_text="Mô tả SEO (≤160 ký tự).")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            # === FIX 2: Slug theo đường dẫn cha → con để tránh trùng ===
            # VD: "Áo" trong "Nam" → slug = "nam-ao", trong "Nữ" → slug = "nu-ao"
            base = slugify(self.name)
            if self.parent:
                # Lấy slug của parent (đệ quy nếu parent chưa có slug)
                parent_slug = self.parent.slug or slugify(self.parent.name)
                base = f"{parent_slug}-{base}"

            slug = base
            counter = 1
            while Category.objects.filter(slug=slug).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        full_path = [self.name]
        k = self.parent
        while k is not None:
            full_path.append(k.name)
            k = k.parent
        return ' -> '.join(full_path[::-1])

    # === FIX 3: Helper lấy meta_title với fallback ===
    def get_meta_title(self):
        return self.meta_title or self.name

    def get_breadcrumb(self):
        """Trả về list dạng [('Thời trang Nam', '/nam'), ('Áo', '/nam-ao')]
        dùng để render BreadcrumbList schema.org"""
        crumbs = []
        node = self
        while node is not None:
            crumbs.append({'name': node.name, 'slug': node.slug})
            node = node.parent
        return list(reversed(crumbs))

    def get_absolute_url(self):
        return f"/products?category={self.slug}"


# ==========================================
# THUỘC TÍNH SẢN PHẨM
# ==========================================

class Color(models.Model):
    name = models.CharField(max_length=50)
    hex_code = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return self.name


class Size(models.Model):
    name = models.CharField(max_length=20)

    def __str__(self):
        return self.name

# ==========================================
# THƯƠNG HIỆU (BRAND)
# ==========================================

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)
    description = models.TextField(blank=True)
    # lưu địa chỉ trang web chính
    website = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug = base
            counter = 1
            while Brand.objects.filter(slug=slug).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
# ==========================================
# SẢN PHẨM GỐC
# ==========================================

class Product(models.Model):
    category = models.ForeignKey(
        'Category', related_name='products',
        on_delete=models.SET_NULL, null=True
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)

    # === FIX 4: Thêm field SEO riêng cho Product ===
    meta_title = models.CharField(max_length=70, blank=True, help_text="Để trống = dùng name.")
    meta_description = models.CharField(max_length=160, blank=True)
    # Brand giúp schema.org Product đầy đủ hơn → Google hiểu ngữ cảnh tốt hơn
    brand = models.ForeignKey(
        Brand,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        help_text="Thương hiệu sản phẩm"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Schema.org cần updated_at

    class Meta:
        indexes = [
            # === FIX 5: Index để query nhanh hơn ===
            models.Index(fields=['slug']),
            models.Index(fields=['category', 'created_at']),
        ]

    @property
    def min_price(self):
        variant = self.variants.filter(stock_quantity__gt=0).order_by('price').first()
        return variant.price if variant else None

    @property
    def max_price(self):
        variant = self.variants.filter(stock_quantity__gt=0).order_by('-price').first()
        return variant.price if variant else None

    @property
    def average_rating(self):
        from django.db.models import Avg
        result = self.reviews.aggregate(avg=Avg('rating'))
        return round(result['avg'], 1) if result['avg'] else None

    @property
    def review_count(self):
        return self.reviews.count()

    @property
    def is_in_stock(self):
        return self.variants.filter(stock_quantity__gt=0).exists()

    def get_meta_title(self):
        return self.meta_title or self.name

    def get_absolute_url(self):
        category_slug = self.category.slug if self.category else "all"
        return f"/{category_slug}/{self.slug}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
            counter = 1
            while Product.objects.filter(slug=self.slug).exists():
                self.slug = f"{slugify(self.name)}-{counter}"
                counter += 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ==========================================
# BIẾN THỂ SẢN PHẨM
# ==========================================

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, related_name='variants', on_delete=models.CASCADE)
    color = models.ForeignKey(Color, related_name='variants', on_delete=models.CASCADE)
    size = models.ForeignKey(Size, related_name='variants', on_delete=models.CASCADE)
    sku = models.CharField(max_length=100, unique=True, db_index=True)  # FIX 6: db_index
    stock_quantity = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ('product', 'color', 'size')

    def __str__(self):
        return f"{self.product.name} - {self.color.name} - {self.size.name} (SKU: {self.sku})"

    @property
    def current_price(self):
        now = timezone.now()
        discount = Discount.objects.filter(
            models.Q(variant=self) | models.Q(product=self.product),
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).order_by('-variant').first()

        if discount:
            if discount.discount_type == 'percentage':
                return self.price * (1 - discount.value / 100)
            elif discount.discount_type == 'fixed':
                return max(self.price - discount.value, 0)
        return self.price

    @property
    def availability(self):
        """Trả về chuỗi schema.org ItemAvailability chuẩn"""
        if self.stock_quantity > 0:
            return "https://schema.org/InStock"
        return "https://schema.org/OutOfStock"

    @property
    def variant_image_url(self):
        image_obj = ProductImage.objects.filter(
            product=self.product, color=self.color
        ).order_by('-is_primary').first()
        if not image_obj:
            image_obj = ProductImage.objects.filter(
                product=self.product, is_primary=True
            ).first()
        return image_obj.image.url if image_obj and image_obj.image else None


# ==========================================
# ẢNH SẢN PHẨM
# === FIX 7: Bỏ field `variant` (redundant với `color`) ===
# ==========================================

class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    # Giữ color thôi, vì ảnh theo màu — không theo size
    # variant bị xóa vì: nếu đã có color thì biết variant nào dùng ảnh đó rồi
    color = models.ForeignKey(
        Color, related_name='images',
        on_delete=models.SET_NULL, null=True, blank=True
    )
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=125, blank=True,
        help_text="Alt text cho ảnh (SEO). VD: 'Áo thun nam màu xanh size L'")  # FIX 8: alt_text
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_primary', '-id']

    def __str__(self):
        if self.color:
            return f"Image of {self.product.name} - {self.color.name}"
        return f"Image of {self.product.name}"

    def get_alt_text(self):
        """Fallback auto-generate alt text nếu chưa điền"""
        if self.alt_text:
            return self.alt_text
        parts = [self.product.name]
        if self.color:
            parts.append(f"màu {self.color.name}")
        return ' '.join(parts)


# ==========================================
# GIẢM GIÁ
# ==========================================

class Discount(models.Model):
    DISCOUNT_TYPE_CHOICES = (
        ('percentage', 'Phần trăm (%)'),
        ('fixed', 'Số tiền cố định (VNĐ)'),
    )

    name = models.CharField(max_length=255)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    value = models.DecimalField(max_digits=10, decimal_places=2)

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE,
        related_name='discounts', null=True, blank=True
    )
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.CASCADE,
        related_name='discounts', null=True, blank=True
    )

    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    # === FIX 9: Validation — không cho phép Discount không gắn với gì ===
    def clean(self):
        if not self.product and not self.variant:
            raise ValidationError(
                "Discount phải gắn với ít nhất một Product hoặc một ProductVariant."
            )
        if self.product and self.variant:
            raise ValidationError(
                "Chỉ chọn một trong hai: Product hoặc ProductVariant, không chọn cả hai."
            )

    def is_valid(self):
        now = timezone.now()
        return self.is_active and self.start_date <= now <= self.end_date

    def __str__(self):
        return f"{self.name} - {self.value} ({self.get_discount_type_display()})"


# ==========================================
# PHẦN 2: QUẢN LÝ ĐƠN HÀNG & THANH TOÁN
# ==========================================

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Chờ xử lý'),
        ('processing', 'Đang chuẩn bị hàng'),
        ('shipped', 'Đang giao'),
        ('delivered', 'Đã giao thành công'),
        ('cancelled', 'Đã hủy'),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    shipping_address = models.TextField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending',
        db_index=True  # FIX 10: Index để filter nhanh
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.full_name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.RESTRICT)
    quantity = models.PositiveIntegerField()
    # FIX 11: editable=False — giá chỉ set lúc tạo, không cho sửa sau
    price = models.DecimalField(max_digits=10, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        # Tự động set giá từ variant nếu là item mới (chưa có pk)
        if not self.pk and not self.price:
            self.price = self.variant.current_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity} x {self.variant.sku}"


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('cod', 'Thanh toán khi nhận hàng (COD)'),
        ('vnpay', 'VNPay'),
        ('momo', 'Ví MoMo'),
        ('stripe', 'Thẻ tín dụng (Stripe)'),
    )
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Đang chờ'),
        ('completed', 'Thành công'),
        ('failed', 'Thất bại'),
        ('refunded', 'Đã hoàn tiền'),
    )

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for Order #{self.order.id} - {self.status}"


# ==========================================
# PHẦN 3: NGƯỜI DÙNG
# ==========================================

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    def __str__(self):
        return self.user.username


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        Profile.objects.create(user=instance)


# ==========================================
# CHAT
# === FIX 12: Thêm optional FK tới User ===
# ==========================================

class ChatMessage(models.Model):
    session_id = models.CharField(max_length=255, db_index=True)
    # Nếu user đã đăng nhập, lưu lại để tra lịch sử
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='chat_messages'
    )
    role = models.CharField(max_length=10)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.session_id} - {self.role}: {self.content[:30]}"


# ==========================================
# ĐÁNH GIÁ SẢN PHẨM
# ==========================================

class Review(models.Model):
    RATING_CHOICES = [(i, i) for i in range(1, 6)]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.rating}★)"

    @staticmethod
    def user_can_review(user, product):
        if not user or not user.is_authenticated:
            return False, "Bạn cần đăng nhập để đánh giá."

        has_purchased = OrderItem.objects.filter(
            order__user=user,
            order__status='delivered',
            variant__product=product
        ).exists()

        if not has_purchased:
            return False, "Bạn cần mua và nhận hàng thành công mới được đánh giá."

        already_reviewed = Review.objects.filter(user=user, product=product).exists()
        if already_reviewed:
            return False, "Bạn đã đánh giá sản phẩm này rồi."

        return True, "OK"


# ==========================================
# PHẦN 4: BLOG
# ==========================================

class BlogCategory(models.Model):
    """Danh mục bài viết (VD: Xu hướng, Phong cách, Chăm sóc trang phục)"""
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Blog Category'
        verbose_name_plural = 'Blog Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug = base
            counter = 1
            while BlogCategory.objects.filter(slug=slug).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class BlogPost(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Bản nháp'),
        ('published', 'Đã đăng'),
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)

    author = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='blog_posts'
    )
    category = models.ForeignKey(
        BlogCategory, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='posts'
    )
    # Sản phẩm liên quan — dùng để cross-sell trong bài viết
    related_products = models.ManyToManyField(
        Product, blank=True, related_name='blog_posts'
    )

    thumbnail = models.ImageField(upload_to='blog/thumbnails/', blank=True, null=True)
    content = models.TextField()  # HTML / Markdown từ editor
    excerpt = models.TextField(
        blank=True,
        help_text="Tóm tắt ngắn hiển thị ở trang danh sách. Để trống sẽ tự cắt từ content."
    )

    # SEO
    meta_title = models.CharField(max_length=70, blank=True, help_text="Để trống = dùng title.")
    meta_description = models.CharField(max_length=160, blank=True)

    # Appearance
    banner_color = models.CharField(max_length=20, blank=True, default="#0d0d0d")
    font_family = models.CharField(max_length=30, blank=True, default="georgia")

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft', db_index=True)
    views = models.PositiveIntegerField(default=0, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status', 'published_at']),
        ]

    def save(self, *args, **kwargs):
        # Tự tạo slug
        if not self.slug:
            base = slugify(self.title)
            slug = base
            counter = 1
            while BlogPost.objects.filter(slug=slug).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.slug = slug

        # Tự set published_at khi chuyển sang published lần đầu
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)

    def get_excerpt(self):
        if self.excerpt:
            return self.excerpt
        # Tự cắt 200 ký tự đầu từ content (bỏ HTML tags)
        import re
        clean = re.sub(r'<[^>]+>', '', self.content)
        return clean[:200].strip() + ('...' if len(clean) > 200 else '')

    def get_meta_title(self):
        return self.meta_title or self.title

    def __str__(self):
        return self.title


class BlogComment(models.Model):
    """Bình luận bài viết — không cần mua hàng, chỉ cần đăng nhập"""
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} → {self.post.title[:40]}"


# ==========================================
# PHẦN 5: THÔNG BÁO (NOTIFICATION)
# ==========================================

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('order_status', 'Cập nhật đơn hàng'),
        ('promotion', 'Khuyến mãi'),
        ('system', 'Hệ thống'),
    )

    user = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=20, choices=NOTIFICATION_TYPES, default='system'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE,
        null=True, blank=True, related_name='notifications'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.title}"


ORDER_STATUS_MESSAGES = {
    'pending': ('Đơn hàng đang chờ xử lý', 'Đơn hàng #{order_id} của bạn đã được tiếp nhận và đang chờ xử lý.'),
    'processing': ('Đơn hàng đang được chuẩn bị', 'Đơn hàng #{order_id} của bạn đang được chuẩn bị hàng.'),
    'shipped': ('Đơn hàng đang giao', 'Đơn hàng #{order_id} của bạn đang được vận chuyển.'),
    'delivered': ('Đơn hàng đã giao thành công', 'Đơn hàng #{order_id} đã giao thành công. Cảm ơn bạn đã mua hàng!'),
    'cancelled': ('Đơn hàng đã bị hủy', 'Đơn hàng #{order_id} của bạn đã bị hủy.'),
}


@receiver(post_save, sender=Order)
def create_order_notification(sender, instance, created, **kwargs):
    if not instance.user:
        return
    status = instance.status
    if status in ORDER_STATUS_MESSAGES:
        title_tpl, message_tpl = ORDER_STATUS_MESSAGES[status]
        title = title_tpl
        message = message_tpl.format(order_id=instance.id)
        Notification.objects.create(
            user=instance.user,
            notification_type='order_status',
            title=title,
            message=message,
            order=instance,
        )