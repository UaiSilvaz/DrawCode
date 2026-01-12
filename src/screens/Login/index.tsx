import "./hero.css";

export default function Login() {
    return (
        <section className="hero">
            <div className="glow"></div>

            <div className="container">

                {/* TEXTO */}
                <div className="content">

                    <div className="badge">
                        <div className="avatars">
                            <img src="https://i.pravatar.cc/40?img=1" />
                            <img src="https://i.pravatar.cc/40?img=2" />
                            <img src="https://i.pravatar.cc/40?img=3" />
                        </div>
                        <span>Join community of 1m+ founders</span>
                    </div>

                    <h1>
                        Bem-vindo(a) de volta

                        <span><br></br>Faça login na sua conta</span>
                    </h1>

                    <p>
                        Acesse seu painel de controle e continue criando designs incríveis.
                        Insira suas credenciais abaixo.
                    </p>

                </div>

                {/* FORM */}
                <div className="card">

                    <div className="social-box">

                        <p className="social-title">Login with</p>

                        <div className="social-buttons">

                            <button type="button" className="social-btn google">
                                {/* Google */}
                                <svg viewBox="0 0 48 48" width="22" height="22">
                                    <path fill="currentColor" d="M24 9.5c3.54 0 6.65 1.22 9.1 3.6l6.8-6.8C35.8 2.6 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.9 6.1C12.4 13.2 17.8 9.5 24 9.5z" />
                                    <path fill="currentColor" d="M46.1 24.5c0-1.7-.1-3.3-.4-4.9H24v9.3h12.5c-.5 2.8-2.1 5.2-4.4 6.8l7 5.4c4.1-3.8 7-9.3 7-16.6z" />
                                    <path fill="currentColor" d="M10.5 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-8-6.2C.9 16.8 0 20.3 0 24s.9 7.2 2.5 10.6z" />
                                    <path fill="currentColor" d="M24 48c6.5 0 12-2.1 16-5.8l-7-5.4c-2 1.4-4.6 2.2-9 2.2-6.2 0-11.5-3.7-13.4-9l-8 6.2C6.6 42.6 14.6 48 24 48z" />
                                </svg>

                            </button>

                            <button type="button" className="social-btn x">
                                {/* X / Twitter */}
                                <svg viewBox="0 0 24 24" width="22" height="22">
                                    <path fill="currentColor" d="M18.24 2H21l-6.38 7.29L22 22h-6.78l-5.3-7.32L3.7 22H1l6.82-7.8L2 2h6.95l4.8 6.6L18.24 2z" />
                                </svg>

                            </button>

                            <button type="button" className="social-btn facebook">
                                {/* Facebook */}
                                <svg viewBox="0 0 24 24" width="22" height="22">
                                    <path fill="currentColor" d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 6 4.39 10.98 10.12 11.85v-8.39H7.08V12h3.04V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.46h-2.79v8.39C19.61 22.98 24 18 24 12z" />
                                </svg>

                            </button>

                        </div>

                        <div className="social-divider">
                            <span>or login with email</span>
                        </div>

                    </div>


                    <form>

                        <div className="field">
                            <label>Email</label>
                            <input type="email" placeholder="your@email.com" />
                        </div>

                        <div className="field">
                            <label>Senha</label>
                            <input type="password" placeholder="Enter your password" />
                        </div>

                        <div className="bottom">
                            <p>
                                By logging in, you agree to our <strong>Terms</strong> and{" "}
                                <strong>Privacy Policy</strong>.
                            </p>

                            <button type="submit">Login</button>
                        </div>

                    </form>

                </div>

            </div>
        </section>
    );
}
