import { STANDARD_CATEGORIES } from "@/lib/checklist-categories"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CriterionCategoryField({
  id,
  category,
  onChange
}: {
  id: string
  category: string
  onChange: (category: string) => void
}) {
  const isStandard = STANDARD_CATEGORIES.some((value) => value === category)
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Category
      </Label>
      <Select
        value={isStandard ? category : "Custom"}
        onValueChange={(value) => onChange(value === "Custom" ? "" : value)}
      >
        <SelectTrigger id={id} className="w-full bg-background cursor-pointer">
          <SelectValue placeholder="Select category..." />
        </SelectTrigger>
        <SelectContent>
          {STANDARD_CATEGORIES.map((value) => (
            <SelectItem key={value} value={value}>
              {value === "General" ? "General (All Classrooms)" : value}
            </SelectItem>
          ))}
          <SelectItem value="Custom">Custom / Other Category...</SelectItem>
        </SelectContent>
      </Select>
      {!isStandard && (
        <Input
          id={`${id}-custom`}
          aria-label="Custom category name"
          value={category}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type custom category name..."
          className="bg-background mt-2"
          autoFocus
        />
      )}
    </div>
  )
}
