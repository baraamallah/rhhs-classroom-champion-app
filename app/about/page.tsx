"use client"

import { motion } from "framer-motion"
import { Header } from "@/components/header"
import { LeafIcon, TrophyIcon, StarIcon } from "@/components/icons"
import Image from "next/image"

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
            <Header />

            <main className="container mx-auto px-4 py-12">
                {/* Hero Section */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.div
                        className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                    >
                        <LeafIcon className="h-12 w-12 text-primary" />
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
                        About Green Classrooms
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Empowering students to build a sustainable future, one classroom at a time.
                    </p>
                </motion.div>

                {/* Mission Section */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                        <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                            The Green Classrooms initiative at Rafic Hariri High School aims to foster a culture of environmental responsibility and sustainability among students. By integrating eco-friendly practices into daily classroom life, we encourage students to become active participants in preserving our planet.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Promote energy efficiency and waste reduction",
                                "Encourage recycling and proper waste sorting",
                                "Foster a sense of environmental stewardship",
                                "Reward innovative sustainability practices"
                            ].map((item, index) => (
                                <motion.li
                                    key={index}
                                    className="flex items-center gap-3"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <span>{item}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>
                    <motion.div
                        className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl bg-muted/50 flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Placeholder for an image, using an icon for now if no image is available */}
                        <div className="text-center p-8">
                            <LeafIcon className="h-32 w-32 text-primary/20 mx-auto mb-4" />
                            <p className="text-muted-foreground">Building a Greener Future</p>
                        </div>
                    </motion.div>
                </div>

                {/* How It Works Cards */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: StarIcon,
                                title: "Evaluation",
                                description: "Supervisors visit classrooms regularly to assess environmental practices using a comprehensive checklist."
                            },
                            {
                                icon: TrophyIcon,
                                title: "Competition",
                                description: "Classrooms earn points for their eco-friendly efforts, competing for the top spot on the leaderboard."
                            },
                            {
                                icon: LeafIcon,
                                title: "Recognition",
                                description: "Top-performing classrooms are recognized as 'Green Champions' and awarded for their dedication."
                            }
                        ].map((card, index) => (
                            <motion.div
                                key={index}
                                className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                            >
                                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                                    <card.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                                <p className="text-muted-foreground">{card.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
