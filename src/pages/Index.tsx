import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Camera, Shirt, Heart, Sparkles, Star, ArrowRight, Check, Zap, Shield } from "lucide-react";
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
      
      <div className="min-h-screen relative bg-background">
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
                className="flex items-center gap-3"
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

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
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
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="border-2"
                >
                  Learn More
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center border-2 border-background text-white text-sm font-semibold"
                    >
                      {i}
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
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 rounded-3xl shadow-2xl transform rotate-3 opacity-20" />
                <div className="absolute inset-0 bg-white rounded-3xl shadow-xl p-8 flex flex-col justify-center items-center gap-6">
                  <Shirt className="h-32 w-32 text-purple-600" />
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                      Your Design
                    </h3>
                    <p className="text-muted-foreground">
                      Beautiful collages in minutes
                    </p>
                  </div>
                  
                  {/* Feature Pills */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <div className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Easy Upload
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 text-xs font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Group Voting
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Instant Preview
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="container mx-auto px-4 py-16 lg:py-24 bg-gradient-to-b from-transparent to-purple-50/30">
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
            <h2 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 text-transparent bg-clip-text mb-4">
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
                  <div className={`absolute inset-0 bg-gradient-to-br from-${step.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <CardHeader className="text-center">
                    <div className="relative inline-block mx-auto mb-4">
                      <div className={`w-20 h-20 bg-${step.color}-100 rounded-2xl flex items-center justify-center`}>
                        <step.icon className={`h-10 w-10 text-${step.color}-600`} />
                      </div>
                      <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-${step.color}-200 flex items-center justify-center text-sm font-bold text-${step.color}-700`}>
                        {index + 1}
                      </div>
                    </div>
                    <CardTitle className={`text-xl font-bold bg-gradient-to-r from-${step.color}-600 to-pink-600 text-transparent bg-clip-text`}>
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Why Choose Us?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create the perfect farewell T-shirt
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Create designs in minutes" },
              { icon: Users, title: "Group Friendly", desc: "Perfect for classes & teams" },
              { icon: Shield, title: "Secure & Private", desc: "Your photos are safe" },
              { icon: Heart, title: "Easy to Use", desc: "No design skills needed" },
              { icon: Camera, title: "High Quality", desc: "Print-ready designs" },
              { icon: Star, title: "Free to Start", desc: "No credit card required" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border hover:shadow-lg transition-all duration-300"
              >
                <feature.icon className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600" />
          <motion.div
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
          />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="max-w-3xl mx-auto text-center text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                Ready to Create Something Special?
              </h2>
              <p className="text-lg lg:text-xl mb-8 text-white/90">
                Join thousands of students creating unforgettable farewell memories
              </p>
              <Button 
                size="lg"
                onClick={handleMainAction}
                className="bg-white text-purple-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-lg group"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span>{heroButtonText}</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-muted/30 py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Shirt className="h-6 w-6 text-purple-600" />
                <span className="font-semibold">SignatureDayTshirt</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2025 SignatureDayTshirt. Create memories that last forever.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
