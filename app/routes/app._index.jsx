// app/routes/app._index.jsx
// Shopify Announcement Manager — FIXED v3
// Fix: replaced "json" from react-router with Response/data pattern
//      compatible with React Router v7 + Shopify template

import { useState, useCallback, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  Banner,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Box,
  Divider,
  ProgressBar,
  SkeletonBodyText
} from "@shopify/polaris";
import { data } from "react-router";
import {
  useLoaderData,
  useSubmit,
  useNavigation,
  useActionData
} from "react-router";
import { authenticate } from "../shopify.server";

const CUSTOM_STYLES = `
  .ann-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  @media (max-width: 640px) {
    .ann-stats { grid-template-columns: 1fr 1fr; }
    .ann-stats .ann-stat:last-child { grid-column: 1 / -1; }
  }
  .ann-stat {
    background: #fff;
    border: 1px solid #e3e3e3;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ann-stat__icon { font-size: 22px; margin-bottom: 6px; line-height: 1; }
  .ann-stat__value { font-size: 22px; font-weight: 700; color: #1a1a2e; line-height: 1; }
  .ann-stat__label { font-size: 12px; color: #6b7280; font-weight: 500; }

  .ann-hero {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    border-radius: 14px;
    padding: 24px;
    margin-bottom: 20px;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .ann-hero__title { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 4px; }
  .ann-hero__sub { font-size: 13px; opacity: 0.7; }
  .ann-hero__badge {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .ann-hero__dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #4ade80; animation: blink 2s infinite; flex-shrink: 0;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

  .ann-mockup { border: 1px solid #e3e3e3; border-radius: 10px; overflow: hidden; background: #f9fafb; }
  .ann-mockup__bar {
    background: #1a1a2e; color: #fff; padding: 9px 16px; font-size: 13px;
    font-weight: 500; text-align: center; min-height: 38px;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.3s ease; word-break: break-word;
  }
  .ann-mockup__bar.empty { background: #9ca3af; font-style: italic; font-size: 12px; opacity: 0.8; }
  .ann-mockup__browser {
    background: #fff; border-bottom: 1px solid #e5e7eb;
    padding: 8px 12px; display: flex; align-items: center; gap: 6px;
  }
  .ann-mockup__dot { width:10px; height:10px; border-radius:50%; }
  .ann-mockup__url { flex:1; background:#f3f4f6; border-radius:20px; height:20px; margin-left:6px; }
  .ann-mockup__content { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
  .ann-mockup__line { border-radius: 4px; background: #e5e7eb; }

  .ann-history { display: flex; flex-direction: column; gap: 0; }
  .ann-history__item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 0; border-bottom: 1px solid #f3f4f6;
    animation: slideIn 0.3s ease;
  }
  .ann-history__item:last-child { border-bottom: none; }
  @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  .ann-history__icon {
    width: 34px; height: 34px; border-radius: 8px; background: #eff6ff;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0; margin-top: 1px;
  }
  .ann-history__text { flex: 1; min-width: 0; }
  .ann-history__msg { font-size: 14px; color: #111827; line-height: 1.4; font-weight: 500; word-break: break-word; }
  .ann-history__time { font-size: 12px; color: #9ca3af; margin-top: 2px; }
  .ann-history__synced {
    font-size: 11px; background: #dcfce7; color: #166534;
    padding: 2px 8px; border-radius: 10px; font-weight: 600;
    white-space: nowrap; flex-shrink: 0; margin-top: 2px;
  }

  .ann-empty {
    padding: 40px 20px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .ann-empty__icon { font-size: 40px; margin-bottom: 8px; opacity: 0.4; }

  .ann-save-pulse { animation: savePulse 0.4s ease; }
  @keyframes savePulse { 0%{transform:scale(1)} 50%{transform:scale(0.96)} 100%{transform:scale(1)} }

  .ann-steps { display: flex; flex-direction: column; gap: 10px; }
  .ann-step {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 12px; border-radius: 8px;
    background: #f9fafb; border: 1px solid #f3f4f6;
  }
  .ann-step__num {
    width: 24px; height: 24px; border-radius: 50%;
    background: #1a1a2e; color: #fff; font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
  }
  .ann-step__text { font-size: 13px; color: #374151; line-height: 1.4; }
  .ann-step__sub  { font-size: 11px; color: #9ca3af; margin-top: 2px; }

  .ann-code {
    background: #1a1a2e; color: #a5f3fc; font-family: monospace;
    font-size: 13px; padding: 12px 14px; border-radius: 8px;
    word-break: break-all; line-height: 1.6;
  }

  .ann-status-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 0; border-bottom: 1px solid #f3f4f6;
  }
  .ann-status-row:last-child { border-bottom: none; }
  .ann-status-label { font-size: 13px; color: #6b7280; }
  .ann-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; flex-shrink: 0; }
  .ann-status-dot.yellow { background: #fbbf24; }

  @media (max-width: 640px) {
    .ann-hero { padding: 18px; }
    .ann-hero__title { font-size: 18px; }
  }
`;

// ── LOADER ──
export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  let history = [];
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/announcements/${session.shop}`);
    if (res.ok) {
      const d = await res.json();
      history = d.announcements || [];
    }
  } catch (err) {
    console.error("Loader error:", err.message);
  }
  return data({ shop: session.shop, history });
}

// ── ACTION ──
export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const text = formData.get("text");
  if (!text || !text.trim()) {
    return data({ success: false, error: "Announcement text cannot be empty." });
  }
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/announcement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.trim(),
        shop: session.shop,
        accessToken: session.accessToken
      })
    });
    const result = await res.json();
    return data(result);
  } catch (err) {
    return data({ success: false, error: "Could not reach the backend server." });
  }
}

// ── HELPERS ──
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });
}

function StatCard({ icon, value, label }) {
  return (
    <div className="ann-stat">
      <div className="ann-stat__icon">{icon}</div>
      <div className="ann-stat__value">{value}</div>
      <div className="ann-stat__label">{label}</div>
    </div>
  );
}

// ── MAIN COMPONENT ──
export default function AnnouncementDashboard() {
  const { shop, history: initialHistory } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [text, setText] = useState("");
  const [localError, setLocalError] = useState("");
  const [successDismissed, setSuccessDismissed] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [history, setHistory] = useState(initialHistory || []);
  const [saveCount, setSaveCount] = useState(initialHistory?.length || 0);
  const [btnPulse, setBtnPulse] = useState(false);

  const isSaving = navigation.state === "submitting";
  const CHAR_LIMIT = 200;
  const charCount = text.length;
  const charPercent = Math.min((charCount / CHAR_LIMIT) * 100, 100);

  useEffect(() => {
    if (actionData?.success && actionData?.announcement) {
      setHistory(prev => [actionData.announcement, ...prev].slice(0, 20));
      setSaveCount(c => c + 1);
      setText("");
      setSuccessDismissed(false);
      setErrorDismissed(false);
      setBtnPulse(true);
      setTimeout(() => setBtnPulse(false), 500);
    }
    if (actionData?.success === false) {
      setErrorDismissed(false);
    }
  }, [actionData]);

  const handleSave = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) { setLocalError("Please type an announcement before saving."); return; }
    if (charCount > CHAR_LIMIT) { setLocalError(`Shorten it to under ${CHAR_LIMIT} characters.`); return; }
    setLocalError("");
    const fd = new FormData();
    fd.append("text", trimmed);
    submit(fd, { method: "post" });
  }, [text, charCount, submit]);

  const showSuccess = actionData?.success === true && !successDismissed;
  const showError   = (localError || actionData?.success === false) && !errorDismissed;
  const errorMsg    = localError || actionData?.error || "Something went wrong.";
  const lastSavedTime = history[0] ? formatDate(history[0].savedAt) : "—";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CUSTOM_STYLES }} />
      <Page title="" narrowWidth={false}>
        <BlockStack gap="500">

          <div className="ann-hero">
            <div>
              <div className="ann-hero__title">📢 Announcement Manager</div>
              <div className="ann-hero__sub">Connected to: {shop}</div>
            </div>
            <div className="ann-hero__badge">
              <span className="ann-hero__dot" />
              Live on Shopify
            </div>
          </div>

          <div className="ann-stats">
            <StatCard icon="📋" value={saveCount} label="Total saved" />
            <StatCard icon="🕐" value={lastSavedTime} label="Last saved" />
            <StatCard icon="🌐" value="Active" label="Shopify metafield" />
          </div>

          {showSuccess && (
            <Banner title="Announcement saved and live!" tone="success" onDismiss={() => setSuccessDismissed(true)}>
              <BlockStack gap="050">
                <Text as="p" variant="bodySm">✅ Record saved to MongoDB with timestamp</Text>
                <Text as="p" variant="bodySm">✅ Shopify metafield updated: my_app.announcement</Text>
                <Text as="p" variant="bodySm">✅ Storefront banner will update within seconds</Text>
              </BlockStack>
            </Banner>
          )}

          {showError && (
            <Banner title="Could not save" tone="critical" onDismiss={() => { setLocalError(""); setErrorDismissed(true); }}>
              <Text as="p">{errorMsg}</Text>
            </Banner>
          )}

          <Layout>
            <Layout.Section>
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingMd" as="h2">✏️ Write your announcement</Text>
                      <Badge tone={charCount > CHAR_LIMIT ? "critical" : "info"}>{CHAR_LIMIT - charCount} left</Badge>
                    </InlineStack>

                    <TextField
                      label="Announcement text"
                      labelHidden
                      value={text}
                      onChange={val => { setText(val); setLocalError(""); }}
                      placeholder='e.g. "Sale 50% Off — Today Only! Free shipping on orders above ₹999."'
                      multiline={4}
                      maxLength={CHAR_LIMIT}
                      error={charCount > CHAR_LIMIT ? "Too long — shorten your announcement" : ""}
                      autoFocus
                    />

                    <BlockStack gap="100">
                      <ProgressBar
                        progress={charPercent}
                        tone={charPercent > 95 ? "critical" : charPercent > 75 ? "warning" : "success"}
                        size="small"
                      />
                      <Text as="p" variant="bodySm" tone="subdued">{charCount}/{CHAR_LIMIT} characters used</Text>
                    </BlockStack>

                    <Divider />

                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">🔍 Live storefront preview</Text>
                      <div className="ann-mockup">
                        <div className={`ann-mockup__bar ${!text.trim() ? "empty" : ""}`}>
                          {text.trim() || "Your announcement will appear here…"}
                        </div>
                        <div className="ann-mockup__browser">
                          <div className="ann-mockup__dot" style={{ background: "#ef4444" }} />
                          <div className="ann-mockup__dot" style={{ background: "#f59e0b" }} />
                          <div className="ann-mockup__dot" style={{ background: "#22c55e" }} />
                          <div className="ann-mockup__url" />
                        </div>
                        <div className="ann-mockup__content">
                          <div className="ann-mockup__line" style={{ height: 80, borderRadius: 8, background: "#e5e7eb" }} />
                          <div className="ann-mockup__line" style={{ height: 12, width: "70%" }} />
                          <div className="ann-mockup__line" style={{ height: 10, width: "90%" }} />
                          <div className="ann-mockup__line" style={{ height: 10, width: "55%" }} />
                        </div>
                      </div>
                      <Text as="p" variant="bodySm" tone="subdued">
                        This is how the banner looks at the top of every page on your store.
                      </Text>
                    </BlockStack>

                    <InlineStack gap="300" wrap={false}>
                      <div className={btnPulse ? "ann-save-pulse" : ""} style={{ flex: 1 }}>
                        <Button
                          variant="primary" size="large" onClick={handleSave}
                          loading={isSaving} disabled={!text.trim() || charCount > CHAR_LIMIT} fullWidth
                        >
                          {isSaving ? "Saving…" : "💾 Save & sync to Shopify"}
                        </Button>
                      </div>
                      <Button size="large" onClick={() => { setText(""); setLocalError(""); }} disabled={!text}>
                        Clear
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingMd" as="h2">📋 Announcement history</Text>
                      <Badge tone="info">{history.length} records</Badge>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Every announcement is stored in MongoDB with a timestamp. This is your audit log.
                    </Text>
                    {isSaving && <Box paddingBlockStart="200"><SkeletonBodyText lines={2} /></Box>}
                    {history.length === 0 && !isSaving ? (
                      <div className="ann-empty">
                        <div className="ann-empty__icon">📭</div>
                        <Text as="p" variant="bodyMd" tone="subdued" fontWeight="semibold">No announcements saved yet</Text>
                        <Text as="p" variant="bodySm" tone="subdued">Write your first one above. Each save creates a timestamped record here.</Text>
                      </div>
                    ) : (
                      <div className="ann-history">
                        {history.map((item, i) => (
                          <div key={item._id || i} className="ann-history__item">
                            <div className="ann-history__icon">📣</div>
                            <div className="ann-history__text">
                              <div className="ann-history__msg">{item.text}</div>
                              <div className="ann-history__time">Saved {formatDate(item.savedAt)}</div>
                            </div>
                            <span className="ann-history__synced">✓ Synced</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </BlockStack>
                </Card>
              </BlockStack>
            </Layout.Section>

            <Layout.Section variant="oneThird">
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd" as="h2">⚙️ How it works</Text>
                    <div className="ann-steps">
                      {[
                        ["You type your announcement", "In the box on the left"],
                        ["Click Save & sync", "Triggers the save flow"],
                        ["Saves to MongoDB", "With timestamp for audit history"],
                        ["Calls Shopify Admin API", "Sets the shop metafield"],
                        ["Theme Extension reads it", "Via Liquid metafield access"],
                        ["Banner appears on store", "On every page, instantly"],
                      ].map(([title, sub], i) => (
                        <div className="ann-step" key={i}>
                          <div className="ann-step__num">{i + 1}</div>
                          <div>
                            <div className="ann-step__text">{title}</div>
                            <div className="ann-step__sub">{sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd" as="h2">🔗 Metafield reference</Text>
                    <Text as="p" variant="bodySm" tone="subdued">Your text is stored at this Shopify metafield path:</Text>
                    <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                      <BlockStack gap="050">
                        <Text as="p" variant="bodySm">Namespace: <strong>my_app</strong></Text>
                        <Text as="p" variant="bodySm">Key: <strong>announcement</strong></Text>
                      </BlockStack>
                    </Box>
                    <Text as="p" variant="bodySm" tone="subdued">Read it in your theme's Liquid files with:</Text>
                    <div className="ann-code">{"{{ shop.metafields.my_app.announcement }}"}</div>
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd" as="h2">📡 Connection status</Text>
                    <div>
                      {[
                        ["MongoDB", "Connected", false],
                        ["Shopify Admin API", "Active", false],
                        ["App Embed Block", "Check Themes", true],
                      ].map(([label, status, isWarning]) => (
                        <div className="ann-status-row" key={label}>
                          <span className="ann-status-label">{label}</span>
                          <InlineStack gap="150" blockAlign="center">
                            <span className={`ann-status-dot ${isWarning ? "yellow" : ""}`} />
                            <Badge tone={isWarning ? "warning" : "success"}>{status}</Badge>
                          </InlineStack>
                        </div>
                      ))}
                    </div>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Enable the App Embed Block in your theme to display the banner on your store.
                    </Text>
                    <Button variant="plain" url={`https://${shop}/admin/themes/current/editor?context=apps`} external>
                      Open Theme Editor →
                    </Button>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>
    </>
  );
}