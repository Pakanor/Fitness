import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import E1RMProgressChart from "./E1RMProgressChart";

export default function ExerciseProgressChart({
  open,
  exerciseId,
  exerciseName,
  onClose,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" } }}
    >
      <DialogTitle
        sx={{
          color: "var(--color-fg-primary)",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Progresja 1RM — {exerciseName}</span>
        <IconButton onClick={onClose} sx={{ color: "var(--color-fg-muted)" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ minHeight: 120 }}>
          {exerciseId ? (
            <E1RMProgressChart exerciseId={exerciseId} />
          ) : (
            <Typography sx={{ color: "var(--color-fg-muted)", py: 4, textAlign: "center" }}>
              Brak zalogowanych serii dla tego ćwiczenia.
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
