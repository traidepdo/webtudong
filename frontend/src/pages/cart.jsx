
import { useNavigate } from 'react-router-dom';

function Cart() {
    const navigate = useNavigate();
    const token = localStorage.getItem('access_token')
    if (!token) {
        navigate('/login')
    }
    else {
        navigate('/checkout')
    }
}
