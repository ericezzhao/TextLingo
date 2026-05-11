"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
	{ label: "Home", href: "/", icon: "⌂" },
	{ label: "Create", href: "/create", icon: "✦" },
	{ label: "Courses", href: "/courses", icon: "▥" },
] as const;

type AppShellProps = {
	children: React.ReactNode;
	active?: "home" | "create" | "courses";
	mode?: "page" | "course";
};

export function AppShell({
	children,
	active = "home",
	mode = "page",
}: AppShellProps) {
	const [collapsed, setCollapsed] = useState(false);
	const sidebarWidthClass = collapsed ? "md:pl-20" : "md:pl-64";

	return (
		<div
			className={`${mode === "course" ? "h-screen overflow-hidden" : "min-h-screen"} bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))]`}
		>
			<nav
				className={`fixed inset-y-0 left-0 z-50 hidden border-r border-[hsl(var(--border))] bg-[hsl(var(--surface))] transition-all duration-300 ease-in-out md:block ${collapsed ? "w-20" : "w-64"}`}
			>
				<div className="flex h-full flex-col">
					<div className="border-b border-[hsl(var(--border))] p-4">
						<div className="flex items-center justify-between gap-2">
							<Link
								href="/"
								className={`truncate font-semibold text-[hsl(var(--brand-active))] ${collapsed ? "text-lg" : "text-xl"}`}
								title="TextLingo"
							>
								{collapsed ? "T" : "TextLingo"}
							</Link>
							<button
								type="button"
								onClick={() => setCollapsed((value) => !value)}
								className="rounded-lg p-2 text-[hsl(var(--text-secondary))] transition hover:bg-[hsl(var(--surface-hover))]"
								aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
							>
								{collapsed ? "›" : "‹"}
							</button>
						</div>
					</div>

					<div className="flex-1 overflow-y-auto p-4">
						<ul className="space-y-1">
							{navItems.map((item) => {
								const selected =
									active === "home" && item.label === "Home"
										? true
										: active === "create" && item.label === "Create"
											? true
											: active === "courses" && item.label === "Courses";

								return (
									<li key={item.label}>
										<Link
											href={item.href}
											title={item.label}
											className={`flex w-full items-center rounded-lg px-4 py-3 text-left transition ${collapsed ? "justify-center" : "gap-3"} ${
												selected
													? "bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-primary))] shadow-sm"
													: "text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-primary))]"
											}`}
										>
											<span className="flex size-5 items-center justify-center text-lg">
												{item.icon}
											</span>
											{collapsed ? null : <span>{item.label}</span>}
										</Link>
									</li>
								);
							})}
						</ul>
					</div>
				</div>
			</nav>

			<nav className="fixed inset-x-0 top-0 z-40 md:hidden">
				<div className="bg-[linear-gradient(to_bottom,hsl(var(--surface))_0%,hsl(var(--surface)/0.94)_58%,transparent_100%)] px-4 py-3 backdrop-blur">
					<Link href="/" className="text-2xl font-semibold">
						TextLingo
					</Link>
				</div>
			</nav>

			<main
				className={`${mode === "course" ? "h-screen overflow-hidden pt-16 md:pt-0" : "min-h-screen pb-24 pt-16 md:pt-0"} ${sidebarWidthClass} transition-[padding] duration-300`}
			>
				{mode === "course" ? (
					<div className="flex h-full flex-col px-4 md:p-6">{children}</div>
				) : (
					<div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
						{children}
					</div>
				)}
			</main>

			<nav className="fixed inset-x-0 bottom-0 z-50 p-4 md:hidden">
				<div className="surface-blur-bottom absolute inset-0" />
				<div className="relative flex items-center gap-3 rounded-full border border-[hsl(var(--surface-tertiary))] bg-[hsl(var(--surface)/0.9)] p-1.5 backdrop-blur-sm">
					{navItems.map((item) => (
						<Link
							key={item.label}
							href={item.href}
							className="flex flex-1 items-center justify-center rounded-full py-3 text-xl"
						>
							<span>{item.icon}</span>
							<span className="sr-only">{item.label}</span>
						</Link>
					))}
				</div>
			</nav>
		</div>
	);
}
