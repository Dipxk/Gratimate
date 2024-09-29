"use client";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { RotateCw } from "lucide-react";
import { getAuth } from "firebase/auth"; // Firebase auth
import { getFirestore, addDoc, collection } from "firebase/firestore"; // Firestore
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

const formSchema = z.object({
	name: z
		.string()
		.min(2, "Name cannot be less than 2 characters.")
		.max(100, "Name cannot be more than 100 characters."),
});

const NewHabitDialog = () => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
		},
	});

	// Firebase Firestore instance
	const db = getFirestore();

	// Function to create a new habit in Firestore
	async function createHabit(userId: string, habitName: string) {
		const habitRef = collection(db, "habits"); // reference to the habits collection
		const habit = await addDoc(habitRef, {
			name: habitName,
			userId,
			createdAt: new Date().toISOString(),
		});

		const entriesRef = collection(db, "entries");
		await addDoc(entriesRef, {
			habitId: habit.id,
			userId,
			createdAt: new Date().toISOString(),
			completed: false,
		});
	}

	// Handle form submission
	async function onSubmit(values: z.infer<typeof formSchema>) {
		setSubmitting(true);
		try {
			// Get current user from Firebase Auth
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) {
				toast.error("You must be logged in to create a habit.");
				router.push("/"); // Redirect to login if not authenticated
				return;
			}

			// Get user's ID and create habit
			const userId = user.uid;
			await createHabit(userId, values.name);
			setOpen(false);
			toast.success("Habit created successfully!");
			form.reset(); // Reset form after successful submission
			router.push("/home/habits"); // Redirect to app dashboard
		} catch (error) {
			setOpen(false);
			console.error("Error creating habit:", error);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setOpen(false);
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>Create New Habit</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create a New Habit</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-8"
					>
						<FormField
							control={form.control}
							name="name"
							disabled={submitting}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input
											placeholder="Read for 30 minutes"
											className="text-black"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										The name of the habit you want to track.
										For example, "Read for 30 minutes" or
										"Exercise for 30 minutes"
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button
							type="submit"
							className={`${
								submitting ? "animate-pulse" : ""
							} w-full`}
							disabled={submitting}
						>
							{submitting ? (
								<RotateCw
									className="animate-spin mr-2"
									size={16}
									strokeWidth={2.5}
								/>
							) : null}
							{submitting ? "Saving..." : "Create"}
						</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default NewHabitDialog;
