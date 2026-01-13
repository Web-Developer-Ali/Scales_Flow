"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ContactInformationProps {
  contact: string
  title: string
  email: string
  phone: string
}

export function ContactInformation({ contact, title, email, phone }: ContactInformationProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Primary Contact</p>
            <div>
              <p className="font-semibold text-foreground">{contact}</p>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="text-sm text-blue-500">{email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Phone</p>
            <p className="text-sm text-foreground">{phone}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
