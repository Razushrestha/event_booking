import React, { useEffect } from 'react';
import { BookOpen, Target, Zap, Calendar, Users, Award, Building, Mail } from 'lucide-react';
import Navbar from '@/userComponents/navbar';
import Footer from '@/userComponents/footer';
import event from '@/assets/event.png'
import facebook from '@/assets/facebook.svg';
import instagram from '@/assets/instagram.svg';
import { getOurTeamData } from '@/services/aboutUs';
import { notifyError } from '@/components/toast';

interface ApproachStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface TeamSteps {
  photo: string;
  name: string;
  position: string;
  email: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
  };
  description: string;
}

interface StatCard {
  icon: React.ReactNode;
  number: string;
  label: string;
}

const AboutUs: React.FC = () => {
  const [teams, setTeams] = React.useState<TeamSteps[]>([]);

  const approachSteps: ApproachStep[] = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "LEARN & PLAN",
      description: "We learn about your business, challenges, demand and your requirement the way you want your event to be like. We study and analyze all twists and turns and go forward for the best, so the first step for us is about what you actually want your event to be."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "BUILD & TARGET",
      description: "Let us look after the details and the heavy lifting that comes with planning a professional event. From our network of preferred vendors, we can deliver a full service."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "EXECUTION & DELIVER",
      description: "Finally, this is where our event management expertise comes into execution. From meticulous management of facility details to AV, catering and onsite coordination, we ensure every detail is looked after."
    }
  ];
  // const team: TeamSteps[] = [
  //   {
  //     photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //     name: "John Doe",
  //     position: "CEO",
  //     email: "abc@gmail.com",
  //     facebook: "https://facebook.com/johndoe",
  //     instagram: "https://instagram.com/johndoe",
  //     description: "John is the visionary behind Event Solution, with over 10 years of experience in the event management industry. His leadership and innovative ideas have propelled the company to new heights."
  //   },
  //   {
  //     photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //     name: "John Doe",
  //     position: "CEO",
  //     email: "abc@gmail.com",
  //     facebook: "https://facebook.com/johndoe",
  //     instagram: "https://instagram.com/johndoe",
  //     description: "John is the visionary behind Event Solution, with over 10 years of experience in the event management industry. His leadership and innovative ideas have propelled the company to new heights."
  //   },
  //   {
  //     photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //     name: "Jane Smith",
  //     position: "Event Coordinator",
  //     email: "jane.smith@example.com",
  //     facebook: "https://facebook.com/janesmith",
  //     instagram: "https://instagram.com/janesmith",
  //     description: "Jane brings creativity and meticulous planning to every event. With a background in hospitality and design, she ensures every detail is executed flawlessly."
  //   }
  // ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getOurTeamData();
        setTeams(response);
        console.log(response);
      } catch (error) {
        console.error("Failed to fetch teams data:", error);
        notifyError("Failed to load teams data");
      }
    };
    fetchData();
  }, []);

  const stats: StatCard[] = [
    { icon: <Calendar className="w-6 h-6" />, number: "500+", label: "Events Organized" },
    { icon: <Users className="w-6 h-6" />, number: "200+", label: "Happy Clients" },
    { icon: <Award className="w-6 h-6" />, number: "10+", label: "Years Experience" },
    { icon: <Building className="w-6 h-6" />, number: "50+", label: "Corporate Partners" }
  ];

  const imageUrl = `${import.meta.env.VITE_IMAGE_URL}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navbar />
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r  text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            About <span className="text-yellow-300">Event Solution</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
            Your trusted partner in creating extraordinary events since 2014
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full transform -translate-x-24 translate-y-24"></div>
      </div>

      {/* About Us Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-4xl font-bold text-[#0a519d] mb-6">About Us</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Event Solution Pvt.Ltd. established in 2014 is a constructive and highly dedicated company
              initiated with an objective of managing and organizing different events in respect to different fields.
            </p>
            <div className="w-20 h-1 bg-[#e92429] rounded"></div>
          </div>
          <div className="relative">
            <div className="bg-[#0a519d] rounded-2xl text-white">
              <img className='rounded-2xl' src={event} alt="" />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-[#e92429] text-center hover:shadow-xl transition-shadow">
              <div className="text-[#0a519d] flex justify-center mb-3">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-[#0a519d] mb-1">{stat.number}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Our Team Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-[#0a519d] mb-12 text-center">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teams.map((members, index) => (
              <div key={index} className="bg-gradient-to-br from-white to-gray-50 flex flex-col items-center gap-5 rounded-2xl shadow-lg p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-t-4 border-[#e92429] relative overflow-hidden group h-fit">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-50 z-[-5]"></div>

                {/* Profile Image with enhanced styling */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#e92429] to-[#0a519d] rounded-full opacity-20 scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                  <img
                    className="h-40 w-40 rounded-full object-cover border-4 border-white shadow-lg relative z-10 group-hover:scale-105 transition-transform duration-300"
                    src={imageUrl + members.photo}
                    alt={`${members.name} profile`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/api/placeholder/96/96";
                    }}
                  />
                </div>

                {/* Name and Position Card - Enhanced */}
                <div className='min-h-16 min-w-40 flex flex-col justify-center items-center w-auto bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm px-6 py-3 hover:bg-white transition-colors duration-200'>
                  <h1 className='font-bold text-lg text-[#0a519d] text-center leading-tight'>{members.name}</h1>
                  <h2 className='text-sm text-gray-500 font-medium mt-1'>{members.position}</h2>
                </div>

                {/* Email Card - Improved */}
                <div className='min-h-11 min-w-36 flex items-center justify-center bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm px-4 py-2 hover:bg-white transition-colors duration-200 group/email'>
                  <div className='flex items-center gap-2'>
                    <Mail className='h-4 w-4 text-[#0a519d] group-hover/email:scale-110 transition-transform duration-200' />
                    <span className='text-sm text-gray-700 font-medium truncate max-w-48'>{members.email}</span>
                  </div>
                </div>

                {/* Social Links - Enhanced */}
                <div className='flex justify-center gap-3 mt-2'>
                  {members.socialLinks.facebook && (
                    <a
                      href={members.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/social"
                    >
                      <div className='h-12 w-12 p-2.5 bg-white border border-gray-200 rounded-full cursor-pointer shadow-sm hover:shadow-md hover:scale-110 hover:border-blue-400 transition-all duration-200 flex items-center justify-center'>
                        <img
                          className='h-5 w-5 group-hover/social:scale-110 transition-transform duration-200'
                          src={facebook}
                          alt="Facebook"
                        />
                      </div>
                    </a>
                  )}
                  {members.socialLinks.instagram && (
                    <a
                      href={members.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/social"
                    >
                      <div className='h-12 w-12 p-2.5 bg-white border border-gray-200 rounded-full cursor-pointer shadow-sm hover:shadow-md hover:scale-110 hover:border-pink-400 transition-all duration-200 flex items-center justify-center'>
                        <img
                          className='h-5 w-5 group-hover/social:scale-110 transition-transform duration-200'
                          src={instagram}
                          alt='Instagram'
                        />
                      </div>
                    </a>
                  )}
                </div>

                {/* Description - Full text shown */}
                <div className="w-full px-2 flex-grow flex items-start">
                  <p className='text-sm text-gray-600 text-center leading-relaxed font-medium w-full'>
                    {members.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About Company Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-20">
          <h2 className="text-4xl font-bold text-[#0a519d] mb-8 text-center">About Company</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-700 leading-relaxed mb-6">
                Event Solution Pvt. Ltd., founded in 2014, is a constructive and highly dedicated organization
                founded with the goal of managing and arranging various events in various fields. The name says
                it all: Event Solution is a firm that aims to deliver the best solutions for all of your events,
                making event planning stress-free.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                We have hundreds of clients ranging from major corporations to global brands, and we have
                successfully designed, coordinated, and executed large-scale events. Our caring team of experts
                helps your vision become a reality and adds fascinating insights to your thoughts.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Furthermore we also provide rental services, creative designing services, event counseling and
                all other necessary required services for a successful event. Our team believes in working as a
                team to achieve the greatest outcomes, and their professional expertise working in this industry
                for many years has set our own benchmark with the best client ratings.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a519d]  p-6 rounded-xl text-white text-center">
                <Building className="w-12 h-12 mx-auto mb-3" />
                <h4 className="font-semibold">Corporate Events</h4>
              </div>
              <div className="bg-[#e92429] p-6 rounded-xl text-white text-center">
                <Users className="w-12 h-12 mx-auto mb-3" />
                <h4 className="font-semibold">Social Gatherings</h4>
              </div>
              <div className="bg-[#e92429]  p-6 rounded-xl text-white text-center">
                <Award className="w-12 h-12 mx-auto mb-3" />
                <h4 className="font-semibold">Award Ceremonies</h4>
              </div>
              <div className="bg-[#0a519d] p-6 rounded-xl text-white text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3" />
                <h4 className="font-semibold">Exhibitions</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Our Approach Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-[#0a519d] mb-12 text-center">Our Approach</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {approachSteps.map((step, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border-t-4 border-[#e92429]">
                <div className="text-[#0a519d] mb-6 flex justify-center">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-[#0a519d] mb-4 text-center">{step.title}</h3>
                <p className="text-gray-700 leading-relaxed text-center">{step.description}</p>
                <div className="mt-6 flex justify-center">
                  <div className="w-12 h-1 bg-[#0a519d] rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Excellence Banner */}
        <div className="mt-16 bg-gray-100 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-[#0a519d] mb-4">
            We have established a benchmark in exhibition planning, helping the corporate sector reach new heights.
          </h3>
          <div className="flex justify-center space-x-4 text-[#e92429]">
            <Award className="w-8 h-8" />
            <Award className="w-8 h-8" />
            <Award className="w-8 h-8" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutUs;