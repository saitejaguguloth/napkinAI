"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="py-16 px-6 lg:px-12 border-t border-border">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-3 gap-12 mb-12">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-6"
                        >
                            <h3 className="text-2xl font-bold tracking-tight mb-3">NAPKIN</h3>
                            <p className="text-secondary text-sm">
                                Transform sketches into production UI with multimodal AI.
                            </p>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 md:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2">
                                {["Features", "Pricing", "Documentation", "Changelog"].map(
                                    (item) => (
                                        <li key={item}>
                                            <Link href={`#${item.toLowerCase()}`}>
                                                <span className="text-sm text-secondary hover:text-primary transition-colors">
                                                    {item}
                                                </span>
                                            </Link>
                                        </li>
                                    )
                                )}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2">
                                {["About", "Blog", "Careers", "Contact"].map((item) => (
                                    <li key={item}>
                                        <Link href={`#${item.toLowerCase()}`}>
                                            <span className="text-sm text-secondary hover:text-primary transition-colors">
                                                {item}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4"
                >
                    <p className="text-sm text-secondary">
                        © 2026 NAPKIN. All rights reserved.
                    </p>

                    <div className="flex items-center gap-6">
                        {["Twitter", "GitHub", "Discord"].map((social) => (
                            <Link key={social} href={`#${social.toLowerCase()}`}>
                                <motion.span
                                    whileHover={{ scale: 1.1 }}
                                    className="text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
                                >
                                    {social}
                                </motion.span>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}
