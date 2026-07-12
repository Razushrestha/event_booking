import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, Users, Megaphone, Volume2, Truck, Palette, Star } from 'lucide-react';
import Navbar from '@/userComponents/navbar';
import Footer from '@/userComponents/footer';
import { getServiceClientData } from '@/services/serviceClientServices';
import { notifyError } from '@/components/toast';

interface Service {
  _id: string;
  name: string;
  description: string;
  image: string;
  serviceId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// interface ApiResponse {
//   status: number;
//   success: boolean;
//   data: Service[];
//   error: string | null;
//   message: string;
//   timestamp: string;
// }

const ServicesClient: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock fetch function - replace with your actual API endpoint
  // const fetchServices = async (): Promise<ApiResponse> => {
  //   // Simulate API delay
  //   await new Promise(resolve => setTimeout(resolve, 1500));
    
  //   // Mock API response with your data
  //   return {
  //     status: 200,
  //     success: true,
  //     data: [
  //       {
  //         "_id": "68772ba81bb5b0066ab9c4a7",
  //         "name": "budget & venue layout creation",
  //         "description": "Event Solution helps you plan your event budget and design the perfect venue layout. We make sure your spending is smart and your space is used efficiently to create a smooth and organized event setup",
  //         "image": "/uploads/services/40424097_roob_images.jpg",
  //         "serviceId": "314aabd3-d2e3-4b71-a6db-e83a2a791d24",
  //         "createdAt": "2025-07-16T04:33:44.099Z",
  //         "updatedAt": "2025-07-16T04:45:54.267Z",
  //         "__v": 0
  //       },
  //       {
  //         "_id": "68772c101bb5b0066ab9c4ac",
  //         "name": "customized and digital marketing strategy",
  //         "description": "Event Solution creates a marketing plan based on each client's needs. We design both customized and digital marketing strategies to promote your event effectively. From social media promotion to on-ground branding, we make sure your message reaches the right audience and drives strong engagement.",
  //         "image": "/uploads/services/41669792_bf6e_marketing-personalization-1.jpg",
  //         "serviceId": "cf780aa8-a6b7-48fd-93c3-1381ee7c8011",
  //         "createdAt": "2025-07-16T04:35:28.150Z",
  //         "updatedAt": "2025-07-16T04:54:29.793Z",
  //         "__v": 0
  //       },
  //       {
  //         "_id": "68772e1b1bb5b0066ab9c573",
  //         "name": "audio & visual management",
  //         "description": "Event Solution handles all sound and visual needs for your event. From stage lighting to sound systems, LED screens, and projectors – we make sure everything looks and sounds perfect to create an engaging experience.",
  //         "image": "/uploads/services/41051481_xmhe_Audio-Visual-Service-Page-RSL-Gala-Victoria-Melbourne.png",
  //         "serviceId": "c9e746a6-1d94-4c15-abbb-da19cea3da73",
  //         "createdAt": "2025-07-16T04:44:11.491Z",
  //         "updatedAt": "2025-07-16T04:44:11.491Z",
  //         "__v": 0
  //       },
  //       {
  //         "_id": "68772ef91bb5b0066ab9c57b",
  //         "name": "logistics management",
  //         "description": "Event Solution takes care of all the behind-the-scenes work – from transporting materials to setting up equipment and managing event supplies. We handle everything as per the client's needs, including German hangers, stalls, tables, chairs, and more. We make sure everything is ready on time and in the right place for a smooth and successful event.",
  //         "image": "/uploads/services/41273833_kezl_work-pago-4.jpg",
  //         "serviceId": "c4b4adde-5ca4-4f94-a62a-52be77395131",
  //         "createdAt": "2025-07-16T04:47:53.835Z",
  //         "updatedAt": "2025-07-16T04:49:16.129Z",
  //         "__v": 0
  //       },
  //       {
  //         "_id": "68772fb71bb5b0066ab9c5ec",
  //         "name": "branding",
  //         "description": "Event Solution helps you build a strong brand presence at your event. We design everything as per the client's requirements – from banners and backdrops to customized booths, uniforms, and souvenirs. We make sure your brand stands out and leaves a lasting impression on every visitor.",
  //         "image": "/uploads/services/41463590_bh6y_images_(2).jpg",
  //         "serviceId": "a48dab3a-ba57-4529-9a9a-bec218d40ae6",
  //         "createdAt": "2025-07-16T04:51:03.592Z",
  //         "updatedAt": "2025-07-16T04:51:03.592Z",
  //         "__v": 0
  //       }
  //     ],
  //     error: null,
  //     message: "Services retrieved successfully",
  //     timestamp: "2025-07-24T09:20:14.271Z"
  //   };
  // };

  // useEffect(() => {
  //   const loadServices = async () => {
  //     try {
  //       setLoading(true);
  //       setError(null);
        
  //       // Replace this with your actual API call
  //       // const response = await fetch('/api/services');
  //       // const data: ApiResponse = await response.json();
        
  //       const data = await fetchServices();
        
  //       if (data.success) {
  //         setServices(data.data);
  //       } else {
  //         setError(data.message || 'Failed to load services');
  //       }
  //     } catch (err) {
  //       setError('Failed to fetch services. Please try again later.');
  //       console.error('Error fetching services:', err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   loadServices();
  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getServiceClientData();
        setServices(response); // assuming response has a `services` array
        console.log(response);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        setError("Failed to load services");
        notifyError("Failed to load services");
      } finally {
        setError(null);}
    };

    fetchData();
  }, []);

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('budget') || name.includes('venue')) {
      return <Calendar className="w-8 h-8" />;
    } else if (name.includes('marketing')) {
      return <Megaphone className="w-8 h-8" />;
    } else if (name.includes('audio') || name.includes('visual')) {
      return <Volume2 className="w-8 h-8" />;
    } else if (name.includes('logistics')) {
      return <Truck className="w-8 h-8" />;
    } else if (name.includes('branding')) {
      return <Palette className="w-8 h-8" />;
    } else {
      return <Star className="w-8 h-8" />;
    }
  };

  const formatServiceName = (name: string): string => {
    return name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="w-16 h-16 bg-gradient-to-r from-[#0a519d] to-[#e92429] rounded-full flex items-center justify-center mx-auto mb-4">
  //           <Loader className="w-8 h-8 text-white animate-spin" />
  //         </div>
  //         <h2 className="text-2xl font-semibold text-[#0a519d] mb-2">Loading Services</h2>
  //         <p className="text-gray-600">Please wait while we fetch our services...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#0a519d] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
    const imageUrl = `${import.meta.env.VITE_IMAGE_URL}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navbar />
      {/* Hero Section */}
      <div className=" py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0"></div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Our <span className="text-yellow-300">Services</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto mb-8">
            Comprehensive event solutions tailored to make your vision a reality
          </p>
          {/* <div className="flex justify-center items-center space-x-2 text-lg">
            <Users className="w-6 h-6" />
            <span>{services.length} Professional Services Available</span>
          </div> */}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full transform -translate-x-24 translate-y-24"></div>
      </div>

      {/* Services Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* {services.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">No Services Available</h3>
            <p className="text-gray-500">We're working on adding new services. Please check back soon!</p>
          </div>
        ) : (
          <> */}
            {/* Services Introduction */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#0a519d] mb-4">What We Offer</h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                From concept to execution, we provide end-to-end event solutions that exceed expectations
              </p>
              <div className="w-24 h-1 bg-[#e92429] mx-auto mt-6 rounded"></div>
            </div>

            {/* Services Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  {/* Service Image Placeholder */}
                  <div className="h-48 bg-[#0a519d] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black opacity-20"></div>
                    <div className="relative text-white text-center">
                      <img className='h-' src={imageUrl+ service.image} alt="" />
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full transform translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-10 rounded-full transform -translate-x-8 translate-y-8"></div>
                  </div>

                  <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-[#0a519d] mb-2 leading-tight">
                          {formatServiceName(service.name)}
                        </h3>
                        <div className="w-12 h-1 bg-[#e92429] rounded"></div>
                      </div>
                      <div className="text-[#0a519d] ml-4">
                        {getServiceIcon(service.name)}
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                      {service.description}
                    </p>

                    {/* <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Service ID:</span> 
                        <span className="ml-1 font-mono">{service.serviceId.slice(0, 8)}...</span>
                      </div>
                      
                      <button className="bg-[#0a519d] text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2 group">
                        <span>Learn More</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div> */}
                  </div>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="bg-[#0a519d] rounded-2xl p-12 text-white text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Let's discuss your event requirements and create something extraordinary together
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-[#0a519d] px-8 py-4 rounded-full font-semibold hover:bg-opacity-90 transition-colors flex items-center justify-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Schedule Consultation</span>
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-[#0a519d] transition-colors flex items-center justify-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Contact Our Team</span>
                </button>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg text-center border-l-4 border-[#0a519d]">
                <div className="text-3xl font-bold text-[#0a519d] mb-1">{services.length}</div>
                <div className="text-gray-600">Services Available</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center border-l-4 border-[#e92429]">
                <div className="text-3xl font-bold text-[#e92429] mb-1">500+</div>
                <div className="text-gray-600">Events Completed</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center border-l-4 border-purple-600">
                <div className="text-3xl font-bold text-purple-600 mb-1">200+</div>
                <div className="text-gray-600">Happy Clients</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center border-l-4 border-green-600">
                <div className="text-3xl font-bold text-green-600 mb-1">10+</div>
                <div className="text-gray-600">Years Experience</div>
              </div>
            </div>
          {/* </>
        )} */}
      </div>
      <Footer/>
    </div>
  );
};

export default ServicesClient;