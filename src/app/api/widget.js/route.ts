import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return new NextResponse("console.error('AI Client Closing Agent widget: workspaceId is required.');", {
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    });
  }

  const iframeUrl = `${origin}/widget/${encodeURIComponent(workspaceId)}`;
  const script = `
(function(){
  if (window.__aiClientClosingWidgetLoaded) return;
  window.__aiClientClosingWidgetLoaded = true;

  var open = false;
  var root = document.createElement('div');
  root.id = 'ai-client-closing-widget-root';
  root.style.position = 'fixed';
  root.style.right = '20px';
  root.style.bottom = '20px';
  root.style.zIndex = '2147483647';
  root.style.fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';

  var frame = document.createElement('iframe');
  frame.title = 'AI Receptionist';
  frame.src = ${JSON.stringify(iframeUrl)};
  frame.allow = 'clipboard-write';
  frame.style.width = '390px';
  frame.style.height = '620px';
  frame.style.maxWidth = 'calc(100vw - 32px)';
  frame.style.maxHeight = 'calc(100vh - 100px)';
  frame.style.border = '0';
  frame.style.borderRadius = '28px';
  frame.style.boxShadow = '0 24px 80px rgba(0,0,0,.35)';
  frame.style.display = 'none';
  frame.style.background = 'transparent';

  var button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = '<span style="font-size:18px">✦</span><span>AI Receptionist</span>';
  button.style.height = '56px';
  button.style.padding = '0 18px';
  button.style.border = '0';
  button.style.borderRadius = '999px';
  button.style.background = 'linear-gradient(135deg,#4f46e5,#7c3aed)';
  button.style.color = 'white';
  button.style.fontWeight = '800';
  button.style.fontSize = '14px';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.gap = '9px';
  button.style.boxShadow = '0 18px 45px rgba(79,70,229,.35)';

  button.onclick = function(){
    open = !open;
    frame.style.display = open ? 'block' : 'none';
    button.innerHTML = open ? '<span style="font-size:18px">×</span><span>Close chat</span>' : '<span style="font-size:18px">✦</span><span>AI Receptionist</span>';
  };

  root.appendChild(frame);
  root.appendChild(button);
  document.body.appendChild(root);
})();`;

  return new NextResponse(script, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" } });
}
