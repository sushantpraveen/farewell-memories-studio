
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, Camera, Shirt, Heart, Sparkles, Star, ArrowRight, Check, Zap, Shield, Package, Truck, Settings, Mail, Clock, Globe, MessageCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import SEOHead from "@/components/seo/SEOHead";

// Animated background components (reused from Index.tsx)
const FloatingElement = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
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

const WhatsAppSupport = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-2xl p-6 border border-green-100 min-w-[240px]"
                    >
                        <div className="flex flex-col gap-3">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 text-transparent bg-clip-text flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-green-600" />
                                Chat with Support
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Message us on WhatsApp for any help with your Signature Day Tee!
                            </p>
                            <a
                                href="https://wa.me/917036365724"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 text-lg font-bold text-white transition-all bg-[#25D366] hover:bg-[#128C7E] p-3 rounded-xl shadow-md"
                            >
                                <MessageCircle className="h-5 w-5" />
                                Message Us
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 relative group"
                aria-label="Chat on WhatsApp"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="h-7 w-7" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="whatsapp"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <MessageCircle className="h-7 w-7" />
                        </motion.div>
                    )}
                </AnimatePresence>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                </span>
            </motion.button>
        </div>
    );
};

const HowItWorks = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const steps = [
        {
            icon: Search,
            title: "1. Choose Your Style",
            description: "Browse through our collection of 420+ grid templates and design styles. Pick the one that best represents your batch's personality.",
            color: "purple",
            img: "/images/design.webp"
        },
        {
            icon: Users,
            title: "2. Create Your Group",
            description: "Start a group for your class or batch. Set the number of members, add your batch name, and invite your friends to join the memory-making journey.",
            color: "pink",
            img: "/images/friends_with_tee_cutout .png"
        },
        {
            icon: Camera,
            title: "3. Collective Design",
            description: "Every member uploads their favorite photo. The group votes on the final collage layout, ensuring everyone has a say in the masterpiece.",
            color: "yellow",
            img: "/images/signing_group_cutout.png"
        },
        {
            icon: Shield,
            title: "4. Quality Printing",
            description: "Once the design is finalized, we use premium fabrics and high-end printing technology to bring your memories to life with vibrant colors.",
            color: "purple",
            img: "/images/print.webp"
        },
        {
            icon: Truck,
            title: "5. Fast Delivery",
            description: "We pack each T-shirt with care and deliver it right to your doorstep, ready for the signature day event and a lifetime of memories.",
            color: "pink",
            img: "/images/delivery.webp"
        }
    ];

    const handleStartCreating = () => {
        navigate(isAuthenticated ? '/create-group' : '/auth');
    };

    return (
        <>
            <SEOHead
                title="How It Works - Signature Day Tshirt"
                description="Learn how to create your custom farewell T-shirt. A simple 5-step process from style selection to doorstep delivery."
                keywords="how it works, custom t-shirt process, farewell shirt design, group photo collage"
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
        `}
            </style>

            <div className="min-h-screen relative bg-background font-body">
                <AnimatedBackground />

                {/* Header */}
                <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-16 lg:h-20">
                            <Link to="/" className="flex items-center gap-3">
                                <div className="relative">
                                    <Shirt className="h-8 w-8 lg:h-10 lg:w-10 text-purple-600" />
                                    <motion.div
                                        className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-pink-500"
                                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </div>
                                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 text-transparent bg-clip-text">
                                    Signature Day Tshirt
                                </h1>
                            </Link>

                            <Button
                                onClick={handleStartCreating}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                                size="sm"
                            >
                                Start Creating
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="container mx-auto px-4 py-16 lg:py-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-3xl mx-auto space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                            <Zap className="h-4 w-4" />
                            <span>Simple & Transparent Process</span>
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-heading bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 text-transparent bg-clip-text">
                            Making Memories Should Be Easy
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We've refined every step of the journey to ensure you and your friends get the perfect keepsake without any hassle.
                        </p>
                    </motion.div>
                </section>

                {/* Steps Section */}
                <section className="container mx-auto px-4 py-12 lg:py-24">
                    <div className="space-y-24 max-w-6xl mx-auto">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.7 }}
                                className={`flex flex-col lg:items-center gap-12 ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
                            >
                                <div className="flex-1 space-y-6">
                                    <div className={`w-16 h-16 rounded-2xl bg-${step.color}-100 flex items-center justify-center`}>
                                        <step.icon className={`h-8 w-8 text-${step.color}-600`} />
                                    </div>
                                    <h2 className="text-3xl lg:text-4xl font-heading text-slate-900">
                                        {step.title}
                                    </h2>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>
                                    {index === 0 && (
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate('/')}
                                            className="border-purple-200 hover:bg-purple-50"
                                        >
                                            Explore Catalog <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="relative aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl bg-white p-4">
                                        <img
                                            src={step.img}
                                            alt={step.title}
                                            className="w-full h-full object-contain rounded-2xl"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Features Grid */}
                <section className="bg-slate-50 py-24">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl lg:text-5xl font-heading mb-4">Why Our Process Works</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">We combine modern technology with traditional quality to deliver the best results.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {[
                                {
                                    title: "Collaborative Voting",
                                    desc: "Everyone gets a voice. Our platform handles the democracy of design picking automatically.",
                                    icon: Users
                                },
                                {
                                    title: "Real-time Tracking",
                                    desc: "See your collage grow as members upload photos. Track the production from start to finish.",
                                    icon: Star
                                },
                                {
                                    title: "Bulk Discounts",
                                    desc: "Special pricing for classes and batch orders. High-end quality at affordable prices.",
                                    icon: Sparkles
                                }
                            ].map((f, i) => (
                                <Card key={i} className="border-none shadow-md hover:shadow-xl transition-all">
                                    <CardHeader>
                                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                                            <f.icon className="text-purple-600 h-6 w-6" />
                                        </div>
                                        <CardTitle>{f.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQs */}
                <section className="container mx-auto px-4 py-24">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl lg:text-4xl font-heading mb-12 text-center">Process FAQs</h2>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>How many photos can we add?</AccordionTrigger>
                                <AccordionContent>
                                    Depending on the grid template you choose, you can add anywhere from 10 to 420+ photos. We have designs optimized for small groups and entire college batches.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Can we change the design after voting?</AccordionTrigger>
                                <AccordionContent>
                                    Once production starts, changes aren't possible. However, the group leader can reset the voting or change the design as long as the order hasn't been placed.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>What kind of fabric do you use?</AccordionTrigger>
                                <AccordionContent>
                                    We use premium 100% cotton, bio-washed fabric (180-220 GSM) to ensure the T-shirts are comfortable, breathable, and hold their shape after washing.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="container mx-auto px-4 py-24 text-center">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-[3rem] p-12 lg:p-24 text-white shadow-2xl">
                        <h2 className="text-3xl lg:text-5xl font-heading mb-8">Ready to Start Your Journey?</h2>
                        <p className="text-xl mb-12 opacity-90 max-w-2xl mx-auto">Join thousands of students who have immortalized their memories with Signature Day Tshirt.</p>
                        <Button
                            size="lg"
                            onClick={handleStartCreating}
                            className="bg-white text-purple-600 hover:bg-slate-100 px-12 h-16 text-lg font-bold rounded-2xl"
                        >
                            Create Your Group Now
                        </Button>
                    </div>
                </section>

                {/* Footer (Simplified from Index.tsx) */}
                <footer className="border-t bg-slate-900 text-slate-200 py-12">
                    <div className="container mx-auto px-4 text-center">
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Shirt className="h-6 w-6 text-purple-400" />
                                <span className="font-brand text-white text-xl">SignatureDayTshirt</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-400">
                                <Link to="/" className="hover:text-white transition-colors">Home</Link>
                                <Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
                                <Link to="/ambassador/signup" className="hover:text-white transition-colors">Campus Ambassador</Link>
                            </div>
                            <p className="text-sm text-slate-500 mt-8">
                                © 2026 SignatureDayTshirt. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>

                <WhatsAppSupport />
            </div>
        </>
    );
};

// Import missing icons from lucide-react
import { Search } from "lucide-react";

export default HowItWorks;
