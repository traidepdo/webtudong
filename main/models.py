from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# ==========================================
# PHẦN 1: QUẢN LÝ SẢN PHẨM & BIẾN THỂ
# ==========================================
from django.utils.text import slugify

class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    # parent giúp tạo danh mục con. blank=True, null=True nghĩa là danh mục gốc (không có cha)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories' # Sửa lỗi chính tả trong trang Admin của Django (mặc định nó sẽ ghi là Categorys)

    def save(self, *args, **kwargs):
        # Tự động tạo slug từ tên nếu chưa có
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        # Hiển thị đường dẫn danh mục đẹp mắt trong Admin (VD: Thời trang Nam -> Áo -> Áo thun)
        full_path = [self.name]
        k = self.parent
        while k is not None:
            full_path.append(k.name)
            k = k.parent
        return ' -> '.join(full_path[::-1])
from django.db import models
from django.utils.text import slugify

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
# SẢN PHẨM GỐC
# ==========================================
class Product(models.Model):
    category = models.ForeignKey('Category', related_name='products', on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Thêm property để lấy giá thấp nhất (hiển thị trên danh sách sản phẩm kiểu "Giá từ 100k")
    @property
    def min_price(self):
        # Lấy giá thấp nhất từ tất cả biến thể
        variant = self.variants.order_by('price').first()
        return variant.price if variant else 0

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ==========================================
# BIẾN THỂ SẢN PHẨM (KẾT HỢP PRODUCT + COLOR + SIZE)
# ==========================================

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, related_name='variants', on_delete=models.CASCADE)
    color = models.ForeignKey(Color, related_name='variants', on_delete=models.CASCADE)
    size = models.ForeignKey(Size, related_name='variants', on_delete=models.CASCADE)
    sku = models.CharField(max_length=100, unique=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    # Giá bán gốc của riêng biến thể này
    price = models.DecimalField(max_digits=10, decimal_places=2) 

    class Meta:
        unique_together = ('product', 'color', 'size')

    def __str__(self):
        return f"{self.product.name} - {self.color.name} - {self.size.name} (SKU: {self.sku})"

    @property
    def current_price(self):
        """
        Tính toán giá thực tế sau khi áp dụng giảm giá.
        Ưu tiên: Giảm giá riêng cho Biến thể > Giảm giá cho Sản phẩm gốc.
        """
        now = timezone.now()
        # Tìm ưu đãi còn hiệu lực
        discount = Discount.objects.filter(
            models.Q(variant=self) | models.Q(product=self.product),
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).order_by('-variant').first() # Ưu tiên discount cụ thể của variant trước

        if discount:
            if discount.discount_type == 'percentage':
                # Ví dụ: 100.000 * (1 - 20/100) = 80.000
                return self.price * (1 - discount.value / 100)
            elif discount.discount_type == 'fixed':
                # Ví dụ: 100.000 - 20.000 = 80.000 (không để giá âm)
                return max(self.price - discount.value, 0)
        
        return self.price

    @property
    def variant_image_url(self):
        """
        Tự động lấy ảnh phù hợp nhất cho biến thể:
        1. Ảnh chính của màu đó -> 2. Ảnh bất kỳ của màu đó -> 3. Ảnh chính của sản phẩm.
        """
        from .models import ProductImage # Tránh circular import nếu cần
        
        # Thử tìm ảnh theo màu của biến thể
        image_obj = ProductImage.objects.filter(product=self.product, color=self.color).order_by('-is_primary').first()
        
        # Nếu màu này không có ảnh, lấy ảnh chính đại diện của sản phẩm
        if not image_obj:
            image_obj = ProductImage.objects.filter(product=self.product, is_primary=True).first()
            
        return image_obj.image.url if image_obj and image_obj.image else None
# ==========================================
# ẢNH SẢN PHẨM (LIÊN KẾT THEO MÀU)
# ==========================================
class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    # Thêm related_name='images' để từ Color có thể truy xuất ngược lại ảnh
    variant = models.ForeignKey(ProductVariant, related_name='images', on_delete=models.SET_NULL, null=True, blank=True)
    color = models.ForeignKey(Color, related_name='images', on_delete=models.SET_NULL, null=True, blank=True)
    image = models.ImageField(upload_to='products/')
    is_primary = models.BooleanField(default=False)
    
    class Meta:
        # Ưu tiên hiển thị ảnh chính trước
        ordering = ['-is_primary', '-id']
    
    def __str__(self):
        if self.color:
            return f"Image of {self.product.name} - {self.color.name}"
        return f"Image of {self.product.name}"


from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

class Discount(models.Model):
    DISCOUNT_TYPE_CHOICES = (
        ('percentage', 'Phần trăm (%)'),
        ('fixed', 'Số tiền cố định (VNĐ)'),
    )

    name = models.CharField(max_length=255, verbose_name="Tên chương trình")
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Giá trị giảm")
    
    # Liên kết: Có thể giảm cho cả Sản phẩm hoặc chỉ 1 Biến thể nhất định
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='discounts', null=True, blank=True)
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='discounts', null=True, blank=True)

    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def is_valid(self):
        """Kiểm tra xem mã giảm giá có còn hạn và đang kích hoạt không"""
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

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True) # Hỗ trợ khách vãng lai nếu để null
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    shipping_address = models.TextField()
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.full_name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.RESTRICT) # RESTRICT để không vô tình xóa sản phẩm đã có người mua
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2) # LƯU Ý: Phải lưu lại giá tại thời điểm mua

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

    order = models.ForeignKey(Order, related_name='payments', on_delete=models.CASCADE)
    method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=255, blank=True, null=True) # Mã giao dịch trả về từ VNPay/Momo
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for Order #{self.order.id} - {self.status}"


# ==========================================
# PHẦN 3: THÔNG TIN NGƯỜI DÙNG (PROFILE)
# ==========================================

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    def __str__(self):
        return self.user.username

# Tự động tạo hoặc cập nhật Profile khi User được tạo/cập nhật
# Tự động tạo hoặc cập nhật Profile khi User được tạo/cập nhật
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Sử dung get_or_create để an toàn tuyệt đối
        Profile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Kiểm tra xem user này đã có profile chưa trước khi save
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        # Nếu chưa có (trường hợp user cũ), thì tạo mới luôn
        Profile.objects.create(user=instance)