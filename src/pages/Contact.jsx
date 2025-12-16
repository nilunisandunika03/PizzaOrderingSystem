import { Envelope, Phone, MapPin } from 'phosphor-react';
import './Contact.css';

const Contact = () => {
    return (
        <div className="contact-page">
            <div className="contact-header">
                <div className="container">
                    <h1>Get in Touch</h1>
                    <p>We'd love to hear from you. Send us a message or visit us.</p>
                </div>
            </div>

            <div className="container contact-container">
                <div className="contact-info">
                    <div className="info-card">
                        <div className="icon-box"><Phone size={32} /></div>
                        <h3>Phone</h3>
                        <p>+1 (555) 123-4567</p>
                        <p>Mon-Sun: 10am - 11pm</p>
                    </div>
                    <div className="info-card">
                        <div className="icon-box"><Envelope size={32} /></div>
                        <h3>Email</h3>
                        <p>hello@pizzaslice.com</p>
                        <p>support@pizzaslice.com</p>
                    </div>
                    <div className="info-card">
                        <div className="icon-box"><MapPin size={32} /></div>
                        <h3>Location</h3>
                        <p>123 Pizza Street</p>
                        <p>Food City, FC 90210</p>
                    </div>
                </div>

                <div className="contact-form-section">
                    <h2>Send Message</h2>
                    <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" placeholder="Your Name" />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" placeholder="Your Email" />
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea rows="5" placeholder="How can we help?"></textarea>
                        </div>
                        <button className="btn btn-primary">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
