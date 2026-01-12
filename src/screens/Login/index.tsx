import "./hero.css";

export default function Home() {
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
                        Ready to Transform <br />
                        <span>Your Digital Experience?</span>
                    </h1>

                    <p>
                        Let our design team craft a website that elevates your brand.
                        Book a free session today.
                    </p>

                </div>

                {/* FORM */}
                <div className="card">

                    <div className="image-box">
                        <span>IMAGE HERE</span>
                    </div>

                    <form>

                        <div className="field">
                            <label>Name</label>
                            <input placeholder="Eden Johnson" />
                        </div>

                        <div className="field">
                            <label>Email</label>
                            <input placeholder="Eden@example.com" />
                        </div>

                        <div className="field">
                            <label>Message</label>
                            <textarea placeholder="Write your message here..." />
                        </div>

                        <div className="bottom">
                            <p>
                                By submitting, you agree to our <strong>Terms</strong> and{" "}
                                <strong>Privacy Policy</strong>.
                            </p>

                            <button type="submit">Submit</button>
                        </div>

                    </form>

                </div>

            </div>
        </section>
    );
}
