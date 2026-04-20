from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Category, Color, Size, Product, ProductImage, ProductVariant, Order, OrderItem, Payment, Profile

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = '__all__'

class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = '__all__'

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = '__all__'

class ProductVariantSerializer(serializers.ModelSerializer):
    color_name = serializers.CharField(source='color.name', read_only=True)
    size_name = serializers.CharField(source='size.name', read_only=True)
    # Vì price đã là @property trong Model mới, chỉ cần khai báo như sau:
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    # Lấy thêm URL ảnh đại diện của màu sắc này
    variant_image_url = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'color', 'color_name', 'size', 'size_name', 'sku', 'stock_quantity', 'price', 'variant_image_url']

class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'category', 'category_name', 'name', 'slug', 'description', 'created_at', 'variants', 'images']

class OrderItemSerializer(serializers.ModelSerializer):
    variant_sku = serializers.CharField(source='variant.sku', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'variant', 'variant_sku', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'full_name', 'phone_number', 'shipping_address', 'total_amount', 'status', 'created_at', 'items']

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='profile.phone_number', read_only=True)
    address = serializers.CharField(source='profile.address', read_only=True)
    # Đổi thành date_of_birth cho khớp với Model
    date_of_birth = serializers.DateField(source='profile.date_of_birth', read_only=True)
    avatar = serializers.ImageField(source='profile.avatar', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                  'phone_number', 'address', 'date_of_birth', 'avatar')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # Gợi ý: Chuyển thành required=False để user dễ dàng đăng ký hơn
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(write_only=True, required=False, allow_null=True)
    avatar = serializers.ImageField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'last_name', 'phone_number', 'address', 'date_of_birth', 'avatar')
        
    def create(self, validated_data):
        # 1. Lấy dữ liệu Profile (có thêm giá trị mặc định None để không dính KeyError)
        phone_number = validated_data.pop('phone_number', None)
        address = validated_data.pop('address', None)
        date_of_birth = validated_data.pop('date_of_birth', None)
        avatar = validated_data.pop('avatar', None)
        
        # 2. Tạo User
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )

        # 3. Cập nhật Profile
        profile = user.profile 
        if phone_number:
            profile.phone_number = phone_number
        if address:
            profile.address = address
        if date_of_birth:
            profile.date_of_birth = date_of_birth
        if avatar:
            profile.avatar = avatar
            
        profile.save()

        return user