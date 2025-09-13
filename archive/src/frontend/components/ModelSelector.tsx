import { useQuery } from "@tanstack/react-query"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

// Define types for our models
interface OpenAIModel {
  id: string
  label: string
  active: boolean
}

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
  disabled?: boolean
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false
}: ModelSelectorProps) {
  const {
    data: models = [],
    isLoading,
    isError
  } = useQuery<OpenAIModel[]>({
    queryKey: ["/api/models"],
    // Don't refresh too often - models don't change frequently
    staleTime: 24 * 60 * 60 * 1000,
    // Disable refetching on window focus for this query
    refetchOnWindowFocus: false
  })

  // Filter out inactive models
  const activeModels = models.filter((model) => model.active)

  if (isLoading) {
    return <Skeleton className="h-8 w-28" />
  }

  if (isError || !activeModels.length) {
    // Fallback to default if error or no models available
    return (
      <Select value="gpt-4o-mini" disabled>
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue placeholder="GPT-4o Mini" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  return (
    <Select
      value={selectedModel}
      onValueChange={onModelChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-[140px] h-8">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {activeModels.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
