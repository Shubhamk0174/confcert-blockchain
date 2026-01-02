'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Lock, Zap, Users, Globe, Award, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function About() {
  const features = [
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'Your certificates are secured by immutable blockchain technology, ensuring they can never be altered or forged.',
    },
    {
      icon: Lock,
      title: 'Tamper-Proof',
      description: 'Cryptographic signatures and decentralized storage make certificate fraud impossible.',
    },
    {
      icon: Zap,
      title: 'Instant Verification',
      description: 'Verify any certificate in seconds, anywhere in the world, without intermediaries.',
    },
    {
      icon: Users,
      title: 'Decentralized',
      description: 'No single point of failure. Your certificates exist on a distributed network.',
    },
    {
      icon: Globe,
      title: 'Global Access',
      description: 'Access and verify certificates from anywhere, at any time, on any device.',
    },
    {
      icon: Award,
      title: 'Professional',
      description: 'Issue certificates that meet international standards and are recognized globally.',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Connect Wallet',
      description: 'Connect your Web3 wallet (Ethereum or Solana) to get started',
    },
    {
      number: '2',
      title: 'Create Certificate',
      description: 'Fill in the certificate details and issue it on the blockchain',
    },
    {
      number: '3',
      title: 'Verify Instantly',
      description: 'Anyone can verify the certificate authenticity in seconds',
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">About Us</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About ConfCert
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We&apos;re revolutionizing digital certification by leveraging blockchain technology
            to create secure, verifiable, and tamper-proof certificates.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To provide a secure, transparent, and accessible platform for issuing and verifying
                digital certificates using blockchain technology. We believe in empowering organizations
                and individuals with the tools to create trust and authenticity in the digital world.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Why Choose Us?
            </h2>
            <p className="text-lg text-muted-foreground">
              Built with cutting-edge blockchain technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="mb-3 inline-flex p-2 rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <div className="absolute -top-4 left-6 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                    {step.number}
                  </div>
                  <CardTitle className="pt-6">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Join us in revolutionizing digital certification
              </p>
              <Button asChild size="lg">
                <Link href="/">
                  Start Creating Certificates
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
