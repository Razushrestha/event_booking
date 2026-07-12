import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, MessageSquare, Ticket, Shield, CreditCard, Download, Users, Mail, Phone } from 'lucide-react';
import Navbar from '@/userComponents/navbar';
import Footer from '@/userComponents/footer';
import { useNavigate } from 'react-router-dom';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: 'account' | 'support' | 'tickets' | 'technical' | 'events' | 'payment';
  icon: React.ReactNode;
}

const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqData: FAQItem[] = [
    {
      id: 1,
      question: "How do I reset my password?",
      answer: "Go to the Login page and click on \"Forgot Password\". Enter your registered email address, and you will receive the code in your registered email follow the instructions sent to your email.",
      category: "account",
      icon: <Shield className="w-5 h-5" />
    },
    {
      id: 2,
      question: "How do I contact support?",
      answer: "You can contact support via the contact us section.",
      category: "support",
      icon: <MessageSquare className="w-5 h-5" />
    },
    {
      id: 3,
      question: "Where can I find my ticket?",
      answer: "All your tickets are located under the My Tickets section.",
      category: "tickets",
      icon: <Ticket className="w-5 h-5" />
    },
    {
      id: 4,
      question: "Why Event Solutions is not responding?",
      answer: "Please ensure you have a stable internet connection and try refreshing the app.",
      category: "technical",
      icon: <HelpCircle className="w-5 h-5" />
    },
    {
      id: 5,
      question: "How can I join the event?",
      answer: "You can join the event by clicking on the \"Join\" button in the event details section.",
      category: "events",
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 6,
      question: "How do I pay the fee for the event?",
      answer: "You can go to the join button and there is a payment option available. Pay the fee and send the screenshot of the payment.",
      category: "payment",
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 7,
      question: "How long does the payment verification takes?",
      answer: "Once you have paid the fee, it usually takes 24-48 hours for the payment to be verified.",
      category: "payment",
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 8,
      question: "How can I get a refund?",
      answer: "You can request a refund by contacting support within 14 days of your purchase. Please provide your order details for faster processing.",
      category: "payment",
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 9,
      question: "How to download my ticket?",
      answer: "There is download option in the My Tickets section. You can download your ticket from the My Tickets section.",
      category: "tickets",
      icon: <Download className="w-5 h-5" />
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions', icon: <HelpCircle className="w-5 h-5" />, count: faqData.length },
    { id: 'account', name: 'Account', icon: <Shield className="w-5 h-5" />, count: faqData.filter(item => item.category === 'account').length },
    { id: 'support', name: 'Support', icon: <MessageSquare className="w-5 h-5" />, count: faqData.filter(item => item.category === 'support').length },
    { id: 'tickets', name: 'Tickets', icon: <Ticket className="w-5 h-5" />, count: faqData.filter(item => item.category === 'tickets').length },
    { id: 'events', name: 'Events', icon: <Users className="w-5 h-5" />, count: faqData.filter(item => item.category === 'events').length },
    { id: 'payment', name: 'Payment', icon: <CreditCard className="w-5 h-5" />, count: faqData.filter(item => item.category === 'payment').length },
    { id: 'technical', name: 'Technical', icon: <HelpCircle className="w-5 h-5" />, count: faqData.filter(item => item.category === 'technical').length }
  ];

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: number) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'account': return 'from-blue-500 to-blue-600';
      case 'support': return 'from-green-500 to-green-600';
      case 'tickets': return 'from-purple-500 to-purple-600';
      case 'events': return 'from-[#0a519d] to-blue-700';
      case 'payment': return 'from-[#e92429] to-red-600';
      case 'technical': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <Navbar />
      <div className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 "></div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-10 h-10" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Frequently Asked <span className="text-yellow-300">Questions</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto mb-8">
            Find quick answers to common questions about Event Solution services
          </p>
          <div className="text-lg opacity-75">
            {filteredFAQs.length} questions available
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full transform -translate-x-24 translate-y-24"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Search and Filter Section */}
        <div className="mb-12">
          {/* Search Bar */}
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0a519d] focus:border-[#0a519d] transition-colors bg-white shadow-lg"
            />
          </div>

          {/* Category Filter */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-xl font-semibold transition-all duration-300 flex flex-col items-center space-y-2 ${
                  selectedCategory === category.id
                    ? 'bg-[#0a519d] text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:shadow-lg hover:scale-105 border-2 border-gray-200'
                }`}
              >
                <div className={`${selectedCategory === category.id ? 'text-white' : 'text-[#0a519d]'}`}>
                  {category.icon}
                </div>
                <span className="text-sm">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-16">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">No Questions Found</h3>
              <p className="text-gray-500">Try adjusting your search terms or selecting a different category.</p>
            </div>
          ) : (
            filteredFAQs.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 border-[#e92429]"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getCategoryColor(item.category)} flex items-center justify-center text-white flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-[#0a519d] pr-4">
                      {item.question}
                    </h3>
                  </div>
                  <div className="text-[#0a519d] flex-shrink-0">
                    {openItems.includes(item.id) ? (
                      <ChevronUp className="w-6 h-6" />
                    ) : (
                      <ChevronDown className="w-6 h-6" />
                    )}
                  </div>
                </button>
                
                {openItems.includes(item.id) && (
                  <div className="px-6 pb-6">
                    <div className="ml-14 pl-4 border-l-2 border-gray-200">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact Support Section */}
        <div className="bg-[#0a519d] rounded-2xl p-12 text-white text-center">
          <h2 className="text-4xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you 24/7
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-[#0a519d] px-8 py-4 cursor-pointer rounded-full font-semibold hover:bg-opacity-90 transition-colors flex items-center justify-center space-x-2" onClick={() => navigate('/contact-us')}>
              <MessageSquare className="w-5 h-5" />
              <span>Contact Support</span>
            </button>
            <button className="bg-white text-[#0a519d] px-8 py-4 cursor-pointer rounded-full font-semibold hover:bg-opacity-90 transition-colors flex items-center justify-center space-x-2" onClick={() => navigate('/about-us')}>
              <Users className="w-5 h-5" />
              <span>Meet Our Team</span>
            </button> 
          </div>
        </div>

        {/* Quick Help Section */}
        <div className="flex justify-center items-center gap-8 mt-16">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center border-t-4 border-[#0a519d]">
            <div className="w-16 h-16 bg-[#0a519d] rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#0a519d] mb-2">Call Us</h3>
            <p className="text-gray-600 mb-4">Speak directly with our support team</p>
            <p className="font-semibold text-[#0a519d]">+977-1-4567890</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg text-center border-t-4 border-[#e92429]">
            <div className="w-16 h-16 bg-[#e92429] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#e92429] mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">Get help via email within 24 hours</p>
            <p className="font-semibold text-[#e92429]">support@eventsolution.com.np</p>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;