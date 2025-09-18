
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Camera, Shirt, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCollage } from "@/context/CollageContext";

const Index = () => {
  const { createGroup } = useCollage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shirt className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">FarewellTees</h1>
          </div>
          <div className="flex space-x-2">
            <Link to="/create-group">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Create Group
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Create Memorable
            <span className="text-purple-600"> Farewell T-Shirts</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Design custom photo collage T-shirts with your classmates. Upload photos, vote on layouts, 
            and create the perfect farewell memory that you'll treasure forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/create-group">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4">
                <Users className="mr-2 h-5 w-5" />
                Start a Group
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Create Your Group</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Set up your group with name, graduation year, and number of members. 
                Choose from beautiful grid templates and get a shareable link.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-8 w-8 text-pink-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Upload & Vote</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Each member uploads their photo and votes for their favorite grid layout. 
                Democracy decides the final design!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Shirt className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Get Your Design</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Watch your collage come together in real-time. Download the final design 
                and print your custom farewell T-shirts!
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Heart className="h-12 w-12 text-white mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Create Lasting Memories?
            </h3>
            <p className="text-purple-100 mb-8 text-lg">
              Join thousands of students who've created beautiful farewell T-shirts with their classmates.
            </p>
            <Link to="/create-group">
              <Button size="lg" variant="secondary" className="px-8 py-4">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shirt className="h-6 w-6" />
            <span className="text-lg font-semibold">FarewellTees</span>
          </div>
          <p className="text-gray-400">
            Creating beautiful memories, one T-shirt at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
