'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './style.css';

const API_LOGIN_URL = 'http://localhost:8001/api/v1/auth/login';

const LoginPage = () => {
    const router = useRouter();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        setErrors(prev => ({
            ...prev,
            [name]: ''
        }));
        if (message.type === 'error') {
            setMessage({ type: '', text: '' });
        }
    };

    const validate = () => {
        const newErrors = {};
        const { email, password } = formData;

        if (!email) {
            newErrors.email = 'Email обязателен.';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Некорректный формат Email.';
        }

        if (!password) {
            newErrors.password = 'Пароль обязателен.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const loginUser = async (payload) => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(API_LOGIN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();

                if (data.user_id) {
                    localStorage.setItem('user_id', data.user_id);
                }
                setMessage({
                    type: 'success',
                    text: data.message || 'Вход выполнен успешно. Перенаправление...'
                });

                setTimeout(() => {
                    window.location.replace('/');
                }, 1000);

            } else {
                const errorData = await response.json();
                setMessage({
                    type: 'error',
                    text: errorData.message || `Ошибка входа. Проверьте Email и пароль.`
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Сетевая ошибка. Проверьте подключение или попробуйте позже.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const payload = {
                email: formData.email,
                password: formData.password,
            };
            loginUser(payload);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Авторизация</h2>

                {message.text && (
                    <p className={`server-message ${message.type === 'error' ? 'error-message' : 'success-message'}`}>
                        {message.text}
                    </p>
                )}

                <div className="input-group">
                    <label htmlFor="email">Электронная почта</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="user@example.com"
                        disabled={loading}
                        className={errors.email ? 'input-error' : ''}
                    />
                    {errors.email && <p className="error-message">{errors.email}</p>}
                </div>

                <div className="input-group">
                    <label htmlFor="password">Пароль</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        disabled={loading}
                        className={errors.password ? 'input-error' : ''}
                    />
                    {errors.password && <p className="error-message">{errors.password}</p>}
                </div>

                <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                >
                    {loading ? 'Вход...' : 'Войти'}
                </button>

                <div className="divider">Или</div>

                <Link href="/reg" passHref>
                    <a className="secondary-button">
                        Создать новый аккаунт
                    </a>
                </Link>

            </form>
        </div>
    );
};

export default LoginPage;