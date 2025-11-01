import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, Camera, Shirt, Heart, Sparkles, Star, ArrowRight, Check, Zap, Shield, Package, Truck, Settings, Mail, Clock, Globe, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SEOHead from "@/components/seo/SEOHead";

// Animated background components
const FloatingElement = ({ children, className = "", delay = 0 }) => (
  <motion.div
    className={`absolute ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: [0.3, 0.6, 0.3],
      y: [0, -20, 0],
      rotate: [0, 5, 0]
    }}
    transition={{ 
      duration: 5,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.div>
);

const AnimatedBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50" />
    <FloatingElement className="top-20 left-[10%] text-purple-200" delay={0}>
      <Shirt className="w-16 h-16 opacity-30" />
    </FloatingElement>
    <FloatingElement className="top-40 right-[15%] text-pink-200" delay={1.2}>
      <Camera className="w-12 h-12 opacity-30" />
    </FloatingElement>
    <FloatingElement className="bottom-32 left-[20%] text-yellow-200" delay={2.4}>
      <Heart className="w-10 h-10 opacity-30" />
    </FloatingElement>
    <FloatingElement className="top-60 right-[25%] text-purple-300" delay={1.8}>
      <Star className="w-8 h-8 opacity-30" />
    </FloatingElement>
  </div>
);

const socialProof = [
  {
    img: "/images/teen1.avif",
    name: "Sarah"
  },
  {
    img: "/images/teen2.avif",
    name: "Alex"
  },
  {
    img: "/images/teen3.avif",
    name: "Emma"
  },
]

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userDashboardPath, setUserDashboardPath] = useState<string | null>(null);

  const getLastActiveGroup = (): string | null => {
    return localStorage.getItem('lastActiveGroupId');
  };

  useEffect(() => {
    const determineDashboardPath = () => {
      if (user?.isLeader && user?.groupId) {
        setUserDashboardPath(`/dashboard/${user.groupId}`);
        return;
      }
      
      if (!user?.isLeader && user?.groupId) {
        setUserDashboardPath(null);
        return;
      }
      
      const lastActive = getLastActiveGroup();
      if (lastActive && user?.isLeader) {
        setUserDashboardPath(`/dashboard/${lastActive}`);
        return;
      }
      
      setUserDashboardPath(null);
    };

    determineDashboardPath();
  }, [user?.groupId, user?.isLeader]);

  const handleMainAction = () => {
    if (userDashboardPath) {
      navigate(userDashboardPath);
    } else {
      navigate('/create-group');
    }
  };

  const hasGroup = !!userDashboardPath;
  const buttonText = hasGroup ? 'Go to Dashboard' : 'Create Group';
  const heroButtonText = hasGroup ? 'Go to Dashboard' : 'Start Creating';

  return (
    <>
      <SEOHead 
        title="SignatureDayTshirt - Create Custom Farewell T-Shirts with Photo Collages"
        description="Design memorable farewell T-shirts with your classmates. Upload photos, vote on layouts, and create the perfect photo collage T-shirt for your graduation or farewell day."
        keywords="farewell t-shirts, custom t-shirts, photo collage, graduation shirts, class shirts, signature day, group photo shirts"
      />
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Permanent+Marker&family=Comfortaa:wght@400;500;600;700&display=swap');
          
          .font-brand {
            font-family: 'Permanent Marker', cursive;
            letter-spacing: -0.02em;
          }
          
          .font-heading {
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            letter-spacing: -0.03em;
          }
          
          .font-body {
            font-family: 'Comfortaa', cursive;
          }
          
          .font-decorative {
            font-family: 'Permanent Marker', cursive;
          }
        `}
      </style>
      
      <div className="min-h-screen relative bg-background font-body">
        <AnimatedBackground />

        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b" role="banner">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16 lg:h-20">
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative">
                  <Shirt className="h-8 w-8 lg:h-10 lg:w-10 text-purple-600" />
                  <motion.div
                    className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-pink-500"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 text-transparent bg-clip-text">
                  SignatureDayTshirt
                </h1>
              </motion.div>

              <motion.div 
                className="hidden sm:flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button 
                  onClick={handleMainAction}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  {hasGroup ? (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{buttonText}</span>
                      <span className="sm:hidden">Dashboard</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{buttonText}</span>
                      <span className="sm:hidden">Create</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 lg:py-24" role="main">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                <span>Create memories that last forever</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 text-transparent bg-clip-text">
                Create Your
                <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 text-transparent bg-clip-text">
                  Perfect Farewell
                </span>
                <span className="block">T-Shirt</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Design custom photo collage T-shirts with your classmates. Upload photos, 
                vote on layouts, and create unforgettable memories together.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  onClick={handleMainAction}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 group"
                >
                  <span className="flex items-center gap-2">
                    {hasGroup ? <Users className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    <span>{heroButtonText}</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
                
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    document.getElementById('enhanced-how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="border-2"
                >
                  Learn More
                </Button>
              </div>

                             {/* Social Proof */}
               <div className="flex items-center gap-4 pt-4">
                 <div className="flex -space-x-3">
                   {socialProof.map((person, i) => (
                     <div 
                       key={i}
                       className="w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400"
                       title={person.name}
                     >
                       <img 
                         src={person.img} 
                         alt={person.name}
                         className="w-full h-full object-cover"
                         onError={(e) => {
                           // Fallback to gradient background if image doesn't exist
                           e.currentTarget.style.display = 'none';
                         }}
                       />
                     </div>
                   ))}
                 </div>
                 <div>
                   <p className="text-sm font-semibold">Join 10,000+ Students</p>
                   <p className="text-xs text-muted-foreground">Creating amazing memories</p>
                 </div>
               </div>
            </motion.div>

            {/* Right Content - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-square max-w-lg mx-auto">
                {/* Main Card */}
                <div className="absolute inset-0 bg-white opacity-10 rounded-3xl shadow-2xl" />
                <img src="/images/sign_1.png" alt="Signature Day T-Shirt" className="w-full h-full object-cover rounded-3xl" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        {/* <section id="how-it-works" className="container mx-auto px-4 py-16 lg:py-24 bg-gradient-to-b from-transparent to-purple-50/30">
          <motion.div 
            className="text-center mb-16 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-700 text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              <span>Simple 3-Step Process</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-heading bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 text-transparent bg-clip-text mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Creating your perfect farewell T-shirt is easy and fun
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Users,
                color: "purple",
                title: "Create Your Group",
                description: "Set up your group with name, year, and number of members. Choose from beautiful grid templates.",
                delay: 0.2
              },
              {
                icon: Camera,
                color: "pink",
                title: "Upload & Vote",
                description: "Each member uploads their photo and votes for their favorite grid layout. Democracy decides!",
                delay: 0.4
              },
              {
                icon: Shirt,
                color: "yellow",
                title: "Get Your Design",
                description: "Watch your collage come together in real-time. Download and print your custom T-shirts!",
                delay: 0.6
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: step.delay }}
              >
                <Card className="relative h-full bg-card/50 backdrop-blur-sm border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {step.color === 'purple' && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardHeader className="text-center">
                        <div className="relative inline-block mx-auto mb-4">
                          <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center">
                            <step.icon className="h-10 w-10 text-purple-600" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-sm font-bold text-purple-700">
                            {index + 1}
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                          {step.title}
                        </CardTitle>
                      </CardHeader>
                    </>
                  )}
                  {step.color === 'pink' && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardHeader className="text-center">
                        <div className="relative inline-block mx-auto mb-4">
                          <div className="w-20 h-20 bg-pink-100 rounded-2xl flex items-center justify-center">
                            <step.icon className="h-10 w-10 text-pink-600" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-sm font-bold text-pink-700">
                            {index + 1}
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-pink-600 to-yellow-600 text-transparent bg-clip-text">
                          {step.title}
                        </CardTitle>
                      </CardHeader>
                    </>
                  )}
                  {step.color === 'yellow' && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardHeader className="text-center">
                        <div className="relative inline-block mx-auto mb-4">
                          <div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center">
                            <step.icon className="h-10 w-10 text-yellow-600" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-sm font-bold text-yellow-700">
                            {index + 1}
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 text-transparent bg-clip-text">
                          {step.title}
                        </CardTitle>
                      </CardHeader>
                    </>
                  )}
                  <CardContent className="text-center">
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section> */}

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-8 lg:py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { number: "420+", text: "Grid templates in our catalog" },
              { number: "9,000+", text: "T-shirts delivered without sacrificing quality" },
              { number: "180+", text: "Global reach, delivered to multiple countries" },
              { number: "100K+", text: "Students created memories in past 3 years" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-3xl bg-muted/50 text-center hover:shadow-lg transition-all duration-300"
              >
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text mb-3">
                  {stat.number}
                </div>
                <p className="text-muted-foreground">{stat.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 lg:py-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          <img src="/images/sign_2.png" alt="Signature Day" className="w-full h-full object-cover" />
          <div className="flex flex-col gap-4">
          <h2 className="text-4xl lg:text-5xl font-heading mb-4 text-start bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text font-bold w-fit">
          Why Students Love SignatureDayTshirt for Signature Day?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
          Making memories should be easy, and we made sure of it. From order to delivery, we made the Signature Day experience completely hassle-free. Every student got their own customized T-shirt, perfectly packed and delivered on time — ready to collect all the signatures and memories that matter.
          </p>
          <button onClick={handleMainAction} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-md w-fit">Explore Designs</button>
          </div>
        </div>
        </section>

         {/* Enhanced How It Works Process */}
         <section id="enhanced-how-it-works" className="container mx-auto px-4 py-16 lg:py-24 bg-muted/30">
          <motion.div 
            className="text-center mb-16 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Settings,
                img: "/images/design.webp",
                title: "You Choose Your Design & Personalization",
                description: "Pick your Signature Day T-shirt style, add your batch name, year, photos, or any custom text. We make sure it's truly yours.",
                color: "purple"
              },
              {
                icon: Package,
                img: "/images/print.webp",
                title: "We Print It Only After You Order",
                description: "Every T-shirt is freshly printed after your order. No old stock, only new memories printed with high-quality colors and fabric.",
                color: "pink"
              },
              {
                icon: Truck,
                img: "/images/delivery.webp",
                title: "Packed & Delivered To Your Door",
                description: "We pack it with care and deliver it right to you, ready for your friends to sign, share memories, and keep it forever.",
                color: "yellow"
              }
            ].map((step, index) => (
                             <motion.div
                 key={index}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.7, delay: index * 0.2 }}
                 className="relative"
               >
                 <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                   <div className="relative h-64 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center p-8">
                     <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
                     <img 
                       src={step.img}
                       alt={step.title}
                       className="relative z-10 h-full w-full object-contain"
                     />
                     <div className="absolute top-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
                       <step.icon className="h-7 w-7 text-white" />
                     </div>
                   </div>
                   <CardHeader>
                     <CardTitle className="text-xl font-semibold">{step.title}</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <CardDescription className="text-muted-foreground leading-relaxed">
                       {step.description}
                     </CardDescription>
                   </CardContent>
                 </Card>
               </motion.div>
            ))}
          </div>
        </section>

        {/* Memory-Driven Merch */}
        <section className="px-2 py-16 lg:py-24 bg-gradient-to-b from-transparent to-purple-50/30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16 max-w-7xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-heading mb-4 text-start bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text font-bold w-fit">
              More Than Just T-Shirts. This Is Memory-Driven Merch.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed text-start">
              From farewell to forever, discover how our Signature Day merch turns memories into wearable moments without compromising on style or quality.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                img: "/images/classroom.png",  
                title: "From Classroom to Closet",
                description: "Every design tells your story. We turn school & college memories into meaningful apparel that stays with you forever.",
                gradient: "from-purple-500 to-purple-600"
              },
              {
                img: "/images/premium.png",
                title: "Premium Prints",
                description: "We use premium fabrics to print your memories, making every Signature Day T-shirt look great, feel special, and last long.",
                gradient: "from-pink-500 to-pink-600"
              },
              {
                img: "/images/designs.png",
                title: "Designed to Stand Out",
                description: "Add names, photos, and batch details. Your Signature Tee is created to turn heads and spark conversations on your farewell day.",
                gradient: "from-yellow-500 to-yellow-600"
              },
              {
                img: "/images/shared.png",
                title: "Shared Moments",
                description: "More than just a T-shirt. It's a forever keepsake signed by friends, filled with memories, and a bond you'll never outgrow.",
                gradient: "from-purple-600 to-pink-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className={`h-70 flex items-center justify-center`}>
                    {/* <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Shirt className="h-20 w-20 text-white" />
                    </div> */}
                    <img 
                       src={feature.img}
                       alt={feature.title}
                       className="h-full w-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden py-20 lg:py-20">
          {/* <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600" /> */}
          {/* <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{
              backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
              backgroundSize: "60px 60px"
            }}
          /> */}
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="max-w-7xl mx-auto text-center text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl lg:text-5xl font-heading mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text font-bold w-fit">
              Choose Your Signature Day T-Shirt Style
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed text-start mb-6">Create a T-shirt that speaks your memories. Pick from our best-selling Signature Day designs and customize it with your photos, names, or batch details. Perfect for Farewell Day, School Events, or College Memories — Wear your journey with pride.</p>
              <div className="grid lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, n) => (
                 <img key={n} src={`/images/img${n+1}.jpg`} alt={`Image ${n}`} className="w-full h-full object-cover rounded-lg" />
              ))}
              </div>
            </motion.div>
          </div>
        </section>

         {/* FAQ Section */}
         <section className="container mx-auto px-4 py-4 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-7xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-heading mb-12 px-3 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text font-bold">
              Frequently Asked Questions
            </h2>
            
            <Accordion type="single" collapsible className="space-y-1">
              <AccordionItem value="item-1" className="border-b-2 border-gray-100 px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline">
                  What is Signature Day?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Signature Day is a memorable tradition where classmates create custom T-shirts with photo collages and get them signed by friends. It's a perfect keepsake for graduations, farewells, and special school events.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-b-2 border-gray-100 px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline">
                  Can I Customize My T-Shirt Design?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! You can choose from various grid templates, upload photos of all your classmates, add batch names, years, and custom text. Our platform makes it easy to create a design that's uniquely yours.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-b-2 border-gray-100 px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline">
                  Is There a Minimum Order Quantity?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We recommend ordering for your entire class or group to make the experience more memorable. Contact us for specific minimum order requirements and bulk pricing options.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-b-2 border-gray-100 px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline">
                  How Long Will It Take to Deliver?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Production typically takes 5-7 business days after design approval, with delivery taking an additional 3-5 business days depending on your location. Rush orders may be available upon request.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-b-2 border-gray-100 px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline">
                  Will the Print Quality Last Long?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Absolutely! We use premium quality fabrics and high-grade printing techniques to ensure your T-shirt looks great and lasts long. With proper care, your memories will stay vibrant for years.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border-b-2 border-gray-100 px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline">
                  Can We Order for Entire Class or College?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! We specialize in bulk orders for entire classes, batches, and colleges. Group orders often qualify for special pricing and dedicated support throughout the process.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </section>


        {/* Footer */}
        <footer className="border-t bg-slate-900 text-slate-200 py-12">
          <div className="container mx-auto px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shirt className="h-6 w-6 text-purple-400" />
                  <span className="font-brand text-white">SignatureDayTshirt</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Empowering students to create lasting memories through thoughtful designs and quality apparel.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-semibold text-white mb-4">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link></li>
                  <li><Link to="/create-group" className="text-slate-400 hover:text-white transition-colors">Create Group</Link></li>
                  <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How It Works</a></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="font-semibold text-white mb-4">Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Help Center</a></li>
                </ul>
              </div>

              {/* Contact & Support */}
              <div>
                <h3 className="font-semibold text-white mb-4">Contact & Support</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <a href="mailto:support@signaturedaytshirt.com" className="text-slate-400 hover:text-white transition-colors">
                        support@signaturedaytshirt.com
                      </a>
                      <p className="text-xs text-slate-500 mt-1">We typically respond within 24 hours</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400">Mon-Fri: 9AM-6PM EST</p>
                      <p className="text-xs text-slate-500 mt-1">Weekend support available</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-400">
                © 2025 SignatureDayTshirt. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Global Shipping Available
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;