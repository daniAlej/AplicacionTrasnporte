import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            <div className="landing-overlay"></div>
            <div className="landing-content">
                <div className="landing-logo-container">
                    <div className="landing-logo-circle">
                        <svg className="bus-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 16C4 16.88 4.39 17.67 5 18.22V20C5 20.55 5.45 21 6 21H7C7.55 21 8 20.55 8 20V19H16V20C16 20.55 16.45 21 17 21H18C18.55 21 19 20.55 19 20V18.22C19.61 17.67 20 16.88 20 16V6C20 2.5 16.42 2 12 2C7.58 2 4 2.5 4 6V16ZM7.5 17C6.67 17 6 16.33 6 15.5C6 14.67 6.67 14 7.5 14C8.33 14 9 14.67 9 15.5C9 16.33 8.33 17 7.5 17ZM16.5 17C15.67 17 15 16.33 15 15.5C15 14.67 15.67 14 16.5 14C17.33 14 18 14.67 18 15.5C18 16.33 17.33 17 16.5 17ZM6 11V6H18V11H6Z" fill="currentColor" />
                        </svg>
                    </div>
                </div>

                <h1 className="landing-title">
                    Sistema de Gestión<br />
                    <span className="landing-title-accent">Transporte Público</span>
                </h1>

                <p className="landing-description">
                    Administra rutas, conductores, unidades y reportes de manera eficiente
                </p>

                <div className="landing-features">
                    <div className="feature-card">
                        <div className="feature-icon">🚌</div>
                        <h3>Gestión de Rutas</h3>
                        <p>Control completo de rutas y paradas</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">👥</div>
                        <h3>Conductores</h3>
                        <p>Administración de personal y unidades</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Reportes</h3>
                        <p>Análisis y seguimiento en tiempo real</p>
                    </div>
                </div>

                <button
                    className="landing-cta-button"
                    onClick={() => navigate('/login')}
                >
                    Ingresar al Sistema
                    <svg className="button-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <div className="landing-footer">
                    <p>© 2025 Sistema de Transporte Público</p>
                </div>
            </div>
        </div>
    );
}
