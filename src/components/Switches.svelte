<script lang="ts">
  import { getStandingsContext } from "./context";
  import { FormSwitch } from "./ui/form-switch";

  let { netPoints } = getStandingsContext();
</script>

<FormSwitch
  label="Show net points"
  description="This championship uses net points, which means the worst two results will be dropped."
  checked={netPoints}
  onCheck={(value) => (netPoints = value)}
/>
