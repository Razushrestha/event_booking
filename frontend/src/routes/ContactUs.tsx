import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, User, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import Navbar from '@/userComponents/navbar';
import Footer from '@/userComponents/footer';
import { submitContactForm } from '@/services/contactUserServices';

interface FormData {
  name: string;
  number: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  number?: string;
  email?: string;
  message?: string;
}

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    number: '',
    email: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [message, setMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }

    // Phone Number validation
    if (!formData.number.trim()) {
      newErrors.number = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]{8,}$/.test(formData.number.trim())) {
      newErrors.number = 'Please enter a valid phone number';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const jsonData = {
      name: formData.name,
      number: formData.number,
      email: formData.email,
      message: formData.message
    };

    try {
      const res = await submitContactForm(jsonData);
      console.log('Response:', res);
      setMessage(`Success: ${res.data.message}`);
      setIsSubmitted(true);
      setFormData({
        name: '',
        number: '',
        email: '',
        message: ''
      });
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setMessage(`Error: ${error.response?.data?.message || 'Something went wrong'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone",
      details: [
        { text: "+977-1-4567890", href: "tel:+97714567890" },
        { text: "+977-9876543210", href: "tel:+9779876543210" }
      ],
      color: "[#0a519d]"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      details: [
        { text: "info@eventsolution.com.np", href: "mailto:info@eventsolution.com.np" },
        { text: "contact@eventsolution.com.np", href: "mailto:contact@eventsolution.com.np" }
      ],
      color: "[#e92429]"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Address",
      details: [
        { text: "Kathmandu, Nepal", href: "#" },
        { text: "Bagmati Province", href: "#" }
      ],
      color: "[#0a519d]"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Business Hours",
      details: [
        { text: "Mon - Fri: 9:00 AM - 6:00 PM", href: "#" },
        { text: "Sat: 10:00 AM - 4:00 PM", href: "#" }
      ],
      color: "[#e92429]"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navbar />
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Contact <span className="text-yellow-300">Us</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
            Let's discuss your next event and make it extraordinary together
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactInfo.map((info, index) => (
            <div key={index} className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-${info.color}`}>
              <div className={`w-12 h-12 bg-${info.color} rounded-lg flex items-center justify-center text-white mb-4`}>
                {info.icon}
              </div>
              <h3 className="text-lg font-semibold text-[#0a519d] mb-2">{info.title}</h3>
              {info.details.map((detail, idx) => (
                <p key={idx} className="text-gray-600 text-sm">
                  <a href={detail.href} className="hover:underline">{detail.text}</a>
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Main Contact Form */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-[#0a519d] mb-2">Get In Touch</h2>
            <p className="text-gray-600 mb-8">Fill out the form below and we'll get back to you as soon as possible.</p>

            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#0a519d] focus:border-[#0a519d] transition-colors ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="number" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    id="number"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#0a519d] focus:border-[#0a519d] transition-colors ${errors.number ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.number && (
                  <p className="mt-1 text-sm text-red-500">{errors.number}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#0a519d] focus:border-[#0a519d] transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-4 text-gray-400 w-5 h-5" />
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={5}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#0a519d] focus:border-[#0a519d] transition-colors resize-none ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Tell us about your event requirements..."
                  />
                </div>
                {errors.message && (
                  <p className="mt-1 text-sm text-red-500">{errors.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="w-full bg-[#0a519d] text-white py-4 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
                {isSubmitted && (
                  <div className="mt-4 text-center text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                    Form submitted successfully! We'll get back to you soon.
                  </div>
                )}
                {message && !isSubmitted && (
                  <div className={`mt-4 text-center text-sm p-2 rounded-lg ${message.includes('Success') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-8">
            {/* Why Contact Us */}
            <div className="rounded-2xl shadow-lg p-8">
              <h3 className="text-[#0a519d] text-2xl font-bold mb-4">Why Contact Us?</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-1 text-[#0a519d] flex-shrink-0" />
                  <span>Free consultation for your event needs</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-1 text-[#0a519d] flex-shrink-0" />
                  <span>Custom solutions tailored to your budget</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-1 text-[#0a519d] flex-shrink-0" />
                  <span>Expert team with 10+ years experience</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-1 text-[#0a519d] flex-shrink-0" />
                  <span>24/7 support during event execution</span>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-[#0a519d] mb-6">Our Services</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-[#0a519d] rounded-lg flex items-center justify-center mx-auto mb-2">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium">Corporate Events</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-[#e92429] rounded-lg flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium">Exhibitions</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-[#e92429] rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium">Event Consulting</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-[#0a519d] rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium">Rental Services</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactUs;