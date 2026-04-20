document.addEventListener('DOMContentLoaded', () => {
    console.log('Django Premium Template Loaded');

    // Add sticky header behavior
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.05)';
        } else {
            header.style.background = 'none';
            header.style.boxShadow = 'none';
        }
    });

    // Mobile menu logic (placeholder)
});

let slideContainer = document.querySelector(".into");
let slides = document.querySelectorAll(".cart_slide");
let index = 0;

function updateSlide() {
    slideContainer.style.transform = `translateX(-${index * 100}%)`;
}

// next
function nextSlide() {
    index = (index + 1) % slides.length;
    updateSlide();
}

// prev
function prevSlide() {
    index = (index - 1 + slides.length) % slides.length;
    updateSlide();
}

// click
document.querySelector(".next").onclick = nextSlide;
document.querySelector(".prev").onclick = prevSlide;

// 🔥 AUTO CHẠY (3 giây)
let auto = setInterval(nextSlide, 9000);
