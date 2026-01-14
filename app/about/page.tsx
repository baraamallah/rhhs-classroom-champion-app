"use client"

import { motion } from "framer-motion"
import { Header } from "@/components/header"
import { LeafIcon, TrophyIcon, StarIcon } from "@/components/icons"
import Image from "next/image"
import { Mail } from "lucide-react"

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
                        About Us
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
                        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                            <p>
                                <span className="font-semibold text-foreground">Green Classrooms Initiative:</span> Fostering a culture of sustainability at Rafic Hariri High School. We empower students to protect our planet through daily eco-friendly habits.
                            </p>
                            <p>
                                <span className="font-semibold text-foreground">Tech Meets Eco:</span> This App was built by the <span className="text-primary font-medium">Technical Institute Students</span> in partnership with the <span className="text-green-600 font-medium">RHHS ECO Club</span>. We merged the codes with the consciences to build this platform—demonstrating that technology, when guided by purpose, can deliver real, measurable environmental impact.
                            </p>
                        </div>

                        <div className="mt-8">
                            <ul className="space-y-3">
                                {[
                                    "Promoting energy efficiency & waste reduction",
                                    "Encouraging recycling & smart sorting",
                                    "Rewarding innovation in sustainability"
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
                                        <span className="font-medium">{item}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
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
                    <h2 className="text-3xl font-bold text-center mb-12">How The App Works?</h2>
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

                {/* Meet the Team Section */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-center mb-12">Meet the Team</h2>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Technical Team */}
                        <div>
                            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                                <span className="p-2 bg-primary/10 rounded-lg text-primary text-xl">💻</span>
                                Technical Team
                            </h3>
                            <div className="grid gap-4">
                                {[
                                    { name: "Baraa El-Mallah", role: "Lead Developer", email: "baraa.elmallah@rhhs.edu.lb" },
                                    { name: "Ziad Naholi", role: "Developer", email: "ziad.naholi@rhhs.edu.lb" },
                                ].map((member, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div>
                                            <p className="font-medium">{member.name}</p>
                                            <p className="text-sm text-muted-foreground">{member.role}</p>
                                        </div>
                                        <a href={`mailto:${member.email}`} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
                                            <Mail className="h-5 w-5" />
                                        </a>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* ECO Club Team */}
                        <div>
                            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                                <span className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 text-xl">🌱</span>
                                ECO Club Team
                            </h3>
                            <div className="grid gap-4">
                                {[
                                    { name: "Adam Yehya", role: "Club President", email: "adam.yehya@rhhs.edu.lb" },
                                    { name: "Mariam Baalbaky", role: "Vice President", email: "mariam.baalbaky@rhhs.edu.lb" },
                                ].map((member, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-green-500/50 transition-colors"
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div>
                                            <p className="font-medium">{member.name}</p>
                                            <p className="text-sm text-muted-foreground">{member.role}</p>
                                        </div>
                                        <a href={`mailto:${member.email}`} className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full transition-colors">
                                            <Mail className="h-5 w-5" />
                                        </a>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
