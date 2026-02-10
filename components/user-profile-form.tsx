"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const formSchema = z.object({
    riskTolerance: z.coerce.number().min(1, "Risk tolerance must be at least $1"),
    totalCapital: z.coerce.number().min(100, "Capital should be at least $100"),
    strategyBias: z.enum(["long", "short", "neutral", "theta"]),
    preferredTicker: z.string().min(1, "Please enter a ticker"),
})

interface UserProfileFormProps {
    onUpdate?: (values: z.infer<typeof formSchema>) => void
}

export function UserProfileForm({ onUpdate }: UserProfileFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            riskTolerance: 50,
            totalCapital: 5000,
            strategyBias: "neutral",
            preferredTicker: "SPX",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log("Profile updated:", values)
        onUpdate?.(values)
    }

    return (
        <Card className="w-[400px]">
            <CardHeader>
                <CardTitle>Trading Profile</CardTitle>
                <CardDescription>Configure your risk and strategy preferences.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="totalCapital"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Capital ($)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="riskTolerance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Max Loss Per Trade ($)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Max dollar amount you are willing to lose.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="strategyBias"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Strategy Bias</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a strategy" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="long">Long (Directional Bull)</SelectItem>
                                            <SelectItem value="short">Short (Directional Bear)</SelectItem>
                                            <SelectItem value="neutral">Neutral (Iron Condor/Fly)</SelectItem>
                                            <SelectItem value="theta">Theta (Credit Spreads)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="preferredTicker"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preferred Ticker</FormLabel>
                                    <FormControl>
                                        <Input placeholder="SPX, QQQ, TSLA" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">Save Preferences</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
