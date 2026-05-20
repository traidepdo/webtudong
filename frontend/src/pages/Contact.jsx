import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';
import '../styles/Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <>
      <Helmet>
        <title>Liên Hệ Với Chúng Tôi - Thời Trang Premium</title>
        <meta name="description" content="Liên hệ với chúng tôi để được tư vấn và hỗ trợ tốt nhất về các sản phẩm thời trang. Địa chỉ tại Cần Thơ." />
        <link rel="canonical" href="http://localhost:5173/contact" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "ContactPage",
              "name": "Liên Hệ Với Chúng Tôi",
              "description": "Liên hệ để nhận hỗ trợ về các sản phẩm thời trang.",
              "url": "http://localhost:5173/contact",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+84 123 456 789",
                "contactType": "customer support",
                "email": "support@fashionstore.com",
                "areaServed": "VN",
                "availableLanguage": "Vietnamese"
              }
        
            }
          `}
        </script>
      </Helmet>
      <Header />
      <div className="contact-page">
        <div className="contact-header">
          <h1>Liên Hệ Với Chúng Tôi</h1>
          <p>
            Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn.
            Vui lòng điền thông tin vào form bên dưới hoặc liên hệ qua các kênh hỗ trợ.
          </p>
        </div>

        <div className="contact-container">
          <div className="contact-info">
            <div>
              <h2>Thông Tin Liên Hệ</h2>
              <p>Khám phá thế giới thời trang cùng chúng tôi. Đừng ngần ngại chia sẻ ý kiến của bạn để chúng tôi phục vụ tốt hơn.</p>

              <div className="info-item">
                <div className="info-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div className="info-text">
                  <h4>Địa Chỉ</h4>
                  <p>123 Đường 30/4, Quận Ninh Kiều, TP. Cần Thơ</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <i className="fas fa-phone-alt"></i>
                </div>
                <div className="info-text">
                  <h4>Điện Thoại</h4>
                  <p>+84 123 456 789</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <div className="info-text">
                  <h4>Email</h4>
                  <p>support@fashionstore.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form">
            <h3>Gửi Tin Nhắn</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Họ và Tên</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên của bạn"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Chủ đề</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Bạn cần hỗ trợ về vấn đề gì?"
                  required
                />
              </div>

              <div className="form-group">
                <label>Nội dung</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Viết nội dung tin nhắn ở đây..."
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">Gửi Tin Nhắn</button>
            </form>
          </div>
        </div>

        <div className="map-container">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3928.841518408643!2d105.768426615332!3d10.0287114928313!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0883d2192b0f1%3A0x4c90a391d232ccce!2sCan%20Tho%2C%20Ninh%20Ki%C3%AAu%2C%20Can%20Tho%2C%20Vietnam!5e0!3m2!1svi!2s!4v1655000000000!5m2!1svi!2s"
            allowFullScreen=""
            loading="lazy"
            title="Bản đồ Cần Thơ"
          ></iframe>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Contact;
