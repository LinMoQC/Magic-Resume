/**
 * GenUI widget contract (docs/specs/genui-systematization/design.md). The agent surfaces an
 * interactive card by calling a tool (interruptOn path) or pushing a `ui_widget`
 * event (escape-hatch); both become one `widget` chat message that the registry
 * renders. New cards = a component + one registry entry, not 7 hardcoded switches.
 */

/** Widget kinds = the tool name on the interrupt path (e.g. `request_form`). */
export type WidgetKind = 'request_form';

export type WidgetFieldKind = 'textarea' | 'text' | 'select';

export interface WidgetFormField {
  id: string;
  label: string;
  kind: WidgetFieldKind;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

/** How a widget's result is delivered back to the agent. */
export type WidgetInteraction = 'resume' | 'message' | 'client';

export interface WidgetInstance {
  /** upsert key — the interrupt requestId (or an emit widgetId). */
  widgetId: string;
  kind: WidgetKind;
  props: Record<string, unknown>;
  status: 'pending' | 'submitted' | 'cancelled';
}

/** `ui_widget` SSE payload (escape-hatch path); aligns with push_ui_message. */
export interface WidgetEnvelope {
  kind: WidgetKind;
  props: Record<string, unknown>;
  widgetId?: string;
  merge?: boolean;
}

export interface WidgetActionResult {
  type: 'submit' | 'cancel';
  /** for submit: the collected field values keyed by field id. */
  values?: Record<string, string>;
}
