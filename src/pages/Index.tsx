
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Camera, Shirt, Heart, Sparkles, Star, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCollage } from "@/context/CollageContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Animated background components
const FloatingElement = ({ children, className = "", delay = 0 }) => (
  <motion.div
    className={`absolute ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: [0.5, 1, 0.5],
      y: [0, -15, 0],
      rotate: [0, 5, 0]
    }}
    transition={{ 
      duration: 4,
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
    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-yellow-50/50" />
    <div className="absolute inset-0">
      <FloatingElement className="top-20 left-[10%] text-purple-200" delay={0}>
        <Shirt className="w-12 h-12" />
      </FloatingElement>
      <FloatingElement className="top-40 right-[15%] text-pink-200" delay={1}>
        <Camera className="w-10 h-10" />
      </FloatingElement>
      <FloatingElement className="bottom-32 left-[20%] text-yellow-200" delay={2}>
        <Heart className="w-8 h-8" />
      </FloatingElement>
      <FloatingElement className="top-60 right-[25%] text-purple-200" delay={1.5}>
        <Star className="w-6 h-6" />
      </FloatingElement>
    </div>
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20 backdrop-blur-[1px]" />
  </div>
);

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userDashboardPath, setUserDashboardPath] = useState<string | null>(null);

  // Helper functions for group storage
  const getLastActiveGroup = (): string | null => {
    return localStorage.getItem('lastActiveGroupId');
  };

  useEffect(() => {
    // Determine the best dashboard path for this user
    const determineDashboardPath = () => {
      // First try user's current groupId
      if (user?.groupId) {
        setUserDashboardPath(`/dashboard/${user.groupId}`);
        return;
      }
      
      // Then try last active group from localStorage
      const lastActive = getLastActiveGroup();
      if (lastActive) {
        setUserDashboardPath(`/dashboard/${lastActive}`);
        return;
      }
      
      // No group found - will show create group
      setUserDashboardPath(null);
    };

    determineDashboardPath();
  }, [user?.groupId]);

  const handleMainAction = () => {
    if (userDashboardPath) {
      navigate(userDashboardPath);
    } else {
      navigate('/create-group');
    }
  };

  const hasGroup = !!userDashboardPath;
  const buttonText = hasGroup ? 'Go to Dashboard' : 'Create Group';
  const heroButtonText = hasGroup ? 'Go to Dashboard' : 'Start a Group';

  return (
    <div className="min-h-screen relative bg-white">
      <AnimatedBackground />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <Shirt className="h-8 w-8 text-purple-600" />
                <motion.div
                  className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-pink-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                FarewellTees
              </h1>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button 
                onClick={handleMainAction}
                className="hidden sm:flex bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
              >
                {hasGroup ? (
                  <>
                    <Users className="h-4 w-4" />
                    {buttonText}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {buttonText}
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-pink-300 to-white mx-auto px-4 py-16 sm:py-24 relative">
        <motion.div 
          className="max-w-4xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-block mb-8">
            <motion.div
              className="px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              ✨ Create memories that last forever
            </motion.div>
          </div>

          <motion.h2 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 text-transparent bg-clip-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Create Memorable{" "}
            <span className="relative">
              <span className="relative z-10 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-500 text-transparent bg-clip-text">
                Farewell T-Shirts
              </span>
              <motion.svg
                className="absolute -bottom-2 left-0 w-full h-3 text-yellow-200 z-0"
                viewBox="0 0 100 12"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 1 }}
              >
                <path
                  d="M0,10 Q25,0 50,10 Q75,20 100,10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
              </motion.svg>
            </span>
          </motion.h2>

          <motion.p 
            className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            Design custom photo collage T-shirts with your classmates. Upload photos, vote on layouts, 
            and create the perfect farewell memory that you'll treasure forever.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <Button 
              size="lg" 
              onClick={handleMainAction}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 rounded-full group"
            >
              <span className="flex items-center gap-2">
                {hasGroup ? <Users className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                <span>{heroButtonText}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            <div className="flex items-center gap-2 text-gray-500">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <Camera className="h-4 w-4 text-pink-600" />
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <span className="text-sm">Join thousands of happy students</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            className="inline-block mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* <div className="px-4 py-1.5 rounded-full text-pink-700 text-sm font-medium">
              Simple 3-Step Process
            </div> */}
          </motion.div>
          <h3 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 text-transparent bg-clip-text mb-4">
            How It Works
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Creating your perfect farewell T-shirt is easy and fun. Follow these simple steps to get started.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {/* Connecting Line */}
          <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-100 via-pink-100 to-yellow-100 hidden md:block" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Card className="relative bg-white/80 backdrop-blur-lg border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="relative">
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 relative">
                    <img src="/images/step1.svg" alt="Step 1" className="h-8 w-8" />
                    {/* <Users className="h-8 w-8 text-purple-600" /> */}
                    {/* <div className="absolute -right-1 -top-1 w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-sm font-bold text-purple-700">
                      1
                    </div> */}
                  </div>
                  {/* <motion.div
                    className="absolute -right-2 -top-2 w-12 h-12 bg-purple-100/50 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  /> */}
                </div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                  Create Your Group
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Set up your group with name, year, and number of members. 
                  Choose from beautiful grid templates and get a shareable link.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Card className="relative bg-white/80 backdrop-blur-lg border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="relative">
                  <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4 relative">
                    <Camera className="h-8 w-8 text-pink-600" />
                    {/* <div className="absolute -right-1 -top-1 w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center text-sm font-bold text-pink-700">
                      2
                    </div> */}
                  </div>
                  {/* <motion.div
                    className="absolute -right-2 -top-2 w-12 h-12 bg-pink-100/50 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  /> */}
                </div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-transparent bg-clip-text">
                  Upload & Vote
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Each member uploads their photo and votes for their favorite grid layout. 
                  Democracy decides the final design!
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <Card className="relative bg-white/80 backdrop-blur-lg border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="relative">
                  <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4 relative">
                    <Shirt className="h-8 w-8 text-yellow-600" />
                    {/* <div className="absolute -right-1 -top-1 w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center text-sm font-bold text-yellow-700">
                      3
                    </div> */}
                  </div>
                  {/* <motion.div
                    className="absolute -right-2 -top-2 w-12 h-12 bg-yellow-100/50 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  /> */}
                </div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-pink-600 text-transparent bg-clip-text">
                  Get Your Design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Watch your collage come together in real-time. Download the final design 
                  and print your custom farewell T-shirts!
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600">
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{
              backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
            }}
          />
        </div>

        <div className="relative container mx-auto px-4 py-24">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              className="inline-block mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.3
              }}
            >
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center mx-auto">
                <Heart className="h-10 w-10 text-white" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <h3 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
                Ready to Create{" "}
                <span className="relative">
                  <span className="relative z-10">Lasting Memories</span>
                  <motion.svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-pink-300/30"
                    viewBox="0 0 100 12"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                  >
                    <path
                      d="M0,10 Q25,0 50,10 Q75,20 100,10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                  </motion.svg>
                </span>
                ?
              </h3>

              <p className="text-xl text-purple-100 mb-12 max-w-2xl mx-auto">
                Join thousands of students who've created beautiful farewell T-shirts with their classmates.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  onClick={handleMainAction}
                  className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 rounded-full group"
                >
                  <span className="flex items-center gap-2">
                    {hasGroup ? (
                      <>
                        <Users className="h-5 w-5" />
                        <span>Go to Dashboard</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span>Get Started Now</span>
                      </>
                    )}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>

                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <span className="text-sm text-purple-100">Join the community</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(147,51,234,0.1),_transparent_70%)]" />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left">
                <motion.div 
                  className="flex items-center gap-3 justify-center md:justify-start mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="relative">
                    <Shirt className="h-8 w-8 text-purple-500" />
                    <motion.div
                      className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-pink-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                    FarewellTees
                  </h2>
                </motion.div>
                <p className="text-gray-400 max-w-md mx-auto md:mx-0">
                  Creating beautiful memories, one T-shirt at a time. Join our community and make your farewell special.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 text-center md:text-right">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-purple-400">Quick Links</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                        Features
                      </a>
                    </li>
                    <li>
                      <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
                        How It Works
                      </a>
                    </li>
                    <li>
                      <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                        Pricing
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-pink-400">Support</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#faq" className="text-gray-400 hover:text-white transition-colors">
                        FAQ
                      </a>
                    </li>
                    <li>
                      <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                        Contact
                      </a>
                    </li>
                    <li>
                      <a href="#privacy" className="text-gray-400 hover:text-white transition-colors">
                        Privacy
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-800 text-center">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} FarewellTees. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
