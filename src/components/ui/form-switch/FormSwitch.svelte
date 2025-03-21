<script lang="ts">
  import { Switch } from "@/components/ui/switch";

  type Props = {
    label: string;
    description: string;
    checked: boolean;
    onCheck: (checked: boolean) => void;
  };

  let { label, description, checked, onCheck }: Props = $props();
</script>

<div class="col-span-2">
  <div
    class="space-y-2 flex flex-row items-center justify-between rounded-lg border p-4"
  >
    <div class="space-y-2">
      <div
        class="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[fs-error]:text-destructive"
      >
        {label}
      </div>
      <div class="text-muted-foreground text-sm">{description}</div>
    </div>
    <Switch
      {checked}
      onCheckedChange={(value) => {
        onCheck(value);
      }}
    />
  </div>
</div>
