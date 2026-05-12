---
name: delight
description: "Adds micro-interactions, animated transitions, confetti celebrations, skeleton loaders, playful empty states, and Easter eggs to UI components. Use when the user asks to add animations, micro-interactions, hover effects, loading animations, success celebrations, polish the UI, add Easter eggs, or make an interface feel more alive and engaging."
user-invokable: true
metadata:
  args:
    - name: target
      description: The feature or area to add delight to (optional)
      required: false
---

Add micro-interactions, animated transitions, success celebrations, playful empty states, and Easter eggs to UI components — enhancing usability without blocking core workflows.

## MANDATORY PREPARATION

Use the frontend-design skill — it contains design principles, anti-patterns, and the **Context Gathering Protocol**. Follow the protocol before proceeding — if no design context exists yet, you MUST run teach-impeccable first. Additionally gather: what's appropriate for the domain (playful vs professional vs quirky vs elegant).

---

## Assess Delight Opportunities

Identify where delight would enhance (not distract from) the experience:

1. **Find natural delight moments**:
   - **Success states**: Completed actions (save, send, publish)
   - **Empty states**: First-time experiences, onboarding
   - **Loading states**: Waiting periods that could be entertaining
   - **Achievements**: Milestones, streaks, completions
   - **Interactions**: Hover states, clicks, drags
   - **Errors**: Softening frustrating moments
   - **Easter eggs**: Hidden discoveries for curious users

2. **Understand the context**:
   - What's the brand personality? (Playful? Professional? Quirky? Elegant?)
   - Who's the audience? (Tech-savvy? Creative? Corporate?)
   - What's the emotional context? (Accomplishment? Exploration? Frustration?)
   - What's appropriate? (Banking app ≠ gaming app)

3. **Define delight strategy**:
   - **Subtle sophistication**: Refined micro-interactions (luxury brands)
   - **Playful personality**: Whimsical illustrations and copy (consumer apps)
   - **Helpful surprises**: Anticipating needs before users ask (productivity tools)
   - **Sensory richness**: Satisfying sounds, smooth animations (creative tools)

If any of these are unclear from the codebase, STOP and call the AskUserQuestion tool to clarify.

**CRITICAL**: Delight should enhance usability, never obscure it. If users notice the delight more than accomplishing their goal, you've gone too far.

## Constraints

- Delight moments < 1 second — never delay core functionality
- Skippable and subtle — respect user's task focus
- Match brand personality — celebrate success, empathize with errors, don't be playful during critical failures
- Vary responses over time — same animation every time becomes invisible or annoying

## Delight Techniques

Add personality and joy through these methods:

### Micro-interactions & Animation

**Button delight**:

```css
/* Satisfying button press */
.button {
  transition:
    transform 0.1s,
    box-shadow 0.1s;
}
.button:active {
  transform: translateY(2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Ripple effect on click */
/* Smooth lift on hover */
.button:hover {
  transform: translateY(-2px);
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1); /* ease-out-quart */
}
```

**Loading delight**:

- Playful loading animations (not just spinners)
- Personality in loading messages (write product-specific ones, not generic AI filler)
- Progress indication with encouraging messages
- Skeleton screens with subtle animations

**Success animations**:

- Checkmark draw animation
- Confetti burst for major achievements
- Gentle scale + fade for confirmation
- Satisfying sound effects (subtle)

**Hover surprises**:

- Icons that animate on hover
- Color shifts or glow effects
- Tooltip reveals with personality
- Cursor changes (custom cursors for branded experiences)

### Personality in Copy

**Playful error messages**:

```
"Error 404"
"This page is playing hide and seek. (And winning)"

"Connection failed"
"Looks like the internet took a coffee break. Want to retry?"
```

**Encouraging empty states**:

```
"No projects"
"Your canvas awaits. Create something amazing."

"No messages"
"Inbox zero! You're crushing it today."
```

**Playful labels & tooltips**:

```
"Delete"
"Send to void" (for playful brand)

"Help"
"Rescue me" (tooltip)
```

**IMPORTANT**: Match copy personality to brand. Banks shouldn't be wacky, but they can be warm.

### Success Celebration Example

```tsx
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

function SuccessCheck({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onAnimationComplete={() =>
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } })
          }
        >
          <CheckCircle className="h-12 w-12 text-green-500" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Loading Copy

Write product-specific loading messages, not generic AI filler:

```
✅ "Syncing your load balancer configs..."
✅ "Checking for updates since yesterday..."
✗  "Herding pixels..."
✗  "Consulting the magic 8-ball..."
```

Cliched loading messages like the last two are AI-slop copy — instantly recognizable as machine-generated. Always reference what the product actually does.

**NEVER**:

- Delay core functionality for delight
- Force users through delightful moments (make skippable)
- Use delight to hide poor UX
- Overdo it (less is more)
- Ignore accessibility (animate responsibly, provide alternatives)
- Make every interaction delightful (special moments should be special)
- Sacrifice performance for delight
- Be inappropriate for context (read the room)

## Verify Delight Quality

After implementing, validate each delight feature:

1. **< 1 second duration** — animation completes quickly, never delays the core action
2. **Skippable** — user can proceed without waiting for the animation to finish
3. **Still pleasant on 100th use** — not distracting with repetition
4. **No layout shift** — delight elements don't push content around
5. **Performant** — no jank; lazy-load delight assets (confetti, Lottie should be code-split)
6. **`prefers-reduced-motion` respected** — wrap animations in a motion-safe check:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after { animation-duration: 0.01ms !important; }
   }
   ```
7. **Matches brand and context** — professional apps get subtle refinement, consumer apps can be playful
