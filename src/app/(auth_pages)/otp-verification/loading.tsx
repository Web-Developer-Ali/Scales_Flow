import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mail, RefreshCw } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="text-gray-600 mt-2">Loading verification form...</p>
        </div>

        <Card className="border-blue-200 bg-blue-50 border-2">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <RefreshCw className="h-16 w-16 text-blue-500 animate-spin" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex justify-center space-x-2">
              {[...Array(6)].map((_, index) => (
                <Input key={index} className="w-12 h-12 text-center border-2 animate-pulse bg-blue-100" disabled />
              ))}
            </div>

            <div className="space-y-2">
              <div className="h-10 bg-blue-200 rounded animate-pulse"></div>
              <div className="h-4 bg-blue-200 rounded animate-pulse w-3/4 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
