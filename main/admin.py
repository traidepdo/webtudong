from django.contrib import admin
from .models import Product, Category, Order, OrderItem, Color, Size, ProductImage, ProductVariant, Payment, Profile,ChatMessage,Brand,BlogPost,BlogCategory,BlogComment,Notification
# Register your models here.
admin.site.register(Product)
admin.site.register(Category)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Color)
admin.site.register(Size)
admin.site.register(ProductImage)
admin.site.register(ProductVariant)
admin.site.register(Payment)
admin.site.register(Profile)
admin.site.register(ChatMessage)
admin.site.register(BlogPost)
admin.site.register(BlogCategory)
admin.site.register(BlogComment)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__username']
    readonly_fields = ['created_at']

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']
    list_filter = ['is_active']

