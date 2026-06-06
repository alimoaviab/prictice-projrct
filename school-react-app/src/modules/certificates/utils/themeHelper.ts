export interface CertificateStyles {
  primaryColor: string;
  titleColor: string;
  bodyColor: string;
  headingFont: string;
  recipientFont: string;
  bodyFont: string;
  themeLayout: "classic" | "vintage" | "modern_corners" | "curved_wave" | "geometric" | "honor_ribbon";
}

export function getThemeLayoutHTML(
  layout: string,
  colors: { primaryColor: string; titleColor: string; bodyColor: string }
): string {
  const primary = colors.primaryColor || "#d4a853";
  const title = colors.titleColor || "#1e40af";

  switch (layout) {
    case "vintage":
      return `
        <div style="position:absolute; inset:12px; border:1px solid ${primary}; pointer-events:none;"></div>
        <div style="position:absolute; inset:16px; border:3px solid ${primary}; pointer-events:none;"></div>
        <div style="position:absolute; inset:22px; border:1px solid ${primary}; pointer-events:none;"></div>
        <!-- Corner Flourishes -->
        <svg style="position:absolute; top:28px; left:28px; height:48px; width:48px; fill:${primary}; pointer-events:none;" viewBox="0 0 100 100">
          <path d="M10,10 C20,10 35,15 45,25 C50,30 40,35 30,30 C20,25 15,15 10,10 M10,10 C10,20 15,35 25,45 C30,50 35,40 30,30 C25,20 15,15 10,10 M10,10 C25,25 35,45 35,60 C30,55 25,45 20,40 C15,35 12,25 10,10 M10,10 C25,25 45,35 60,35 C55,30 45,25 40,20 C35,15 25,12 10,10 M30,30 C40,40 50,55 50,70 C45,65 40,55 35,50 C30,45 30,35 30,30 M30,30 C40,40 55,50 70,50 C65,45 55,40 50,35 C45,30 35,30 30,30" />
        </svg>
        <svg style="position:absolute; top:28px; right:28px; height:48px; width:48px; fill:${primary}; transform:rotate(90deg); pointer-events:none;" viewBox="0 0 100 100">
          <path d="M10,10 C20,10 35,15 45,25 C50,30 40,35 30,30 C20,25 15,15 10,10 M10,10 C10,20 15,35 25,45 C30,50 35,40 30,30 C25,20 15,15 10,10 M10,10 C25,25 35,45 35,60 C30,55 25,45 20,40 C15,35 12,25 10,10 M10,10 C25,25 45,35 60,35 C55,30 45,25 40,20 C35,15 25,12 10,10 M30,30 C40,40 50,55 50,70 C45,65 40,55 35,50 C30,45 30,35 30,30 M30,30 C40,40 55,50 70,50 C65,45 55,40 50,35 C45,30 35,30 30,30" />
        </svg>
        <svg style="position:absolute; bottom:28px; left:28px; height:48px; width:48px; fill:${primary}; transform:rotate(-90deg); pointer-events:none;" viewBox="0 0 100 100">
          <path d="M10,10 C20,10 35,15 45,25 C50,30 40,35 30,30 C20,25 15,15 10,10 M10,10 C10,20 15,35 25,45 C30,50 35,40 30,30 C25,20 15,15 10,10 M10,10 C25,25 35,45 35,60 C30,55 25,45 20,40 C15,35 12,25 10,10 M10,10 C25,25 45,35 60,35 C55,30 45,25 40,20 C35,15 25,12 10,10 M30,30 C40,40 50,55 50,70 C45,65 40,55 35,50 C30,45 30,35 30,30 M30,30 C40,40 55,50 70,50 C65,45 55,40 50,35 C45,30 35,30 30,30" />
        </svg>
        <svg style="position:absolute; bottom:28px; right:28px; height:48px; width:48px; fill:${primary}; transform:rotate(180deg); pointer-events:none;" viewBox="0 0 100 100">
          <path d="M10,10 C20,10 35,15 45,25 C50,30 40,35 30,30 C20,25 15,15 10,10 M10,10 C10,20 15,35 25,45 C30,50 35,40 30,30 C25,20 15,15 10,10 M10,10 C25,25 35,45 35,60 C30,55 25,45 20,40 C15,35 12,25 10,10 M10,10 C25,25 45,35 60,35 C55,30 45,25 40,20 C35,15 25,12 10,10 M30,30 C40,40 50,55 50,70 C45,65 40,55 35,50 C30,45 30,35 30,30 M30,30 C40,40 55,50 70,50 C65,45 55,40 50,35 C45,30 35,30 30,30" />
        </svg>
        <!-- Top center accent flourish -->
        <svg style="position:absolute; top:32px; left:50%; transform:translateX(-50%); height:24px; width:120px; fill:${primary}; pointer-events:none;" viewBox="0 0 120 24">
          <path d="M60,0 C68,8 78,4 88,8 C78,10 68,6 60,12 C52,6 42,10 32,8 C42,4 52,8 60,0 Z M60,4 C64,7 70,5 76,7 C70,8 65,6 60,9 C55,6 50,8 44,7 C50,5 56,7 60,4 Z" />
        </svg>
      `;

    case "modern_corners":
      return `
        <!-- Main Accent Corners -->
        <div style="position:absolute; top:10px; right:10px; width:70px; height:70px; border-top:12px solid ${title}; border-right:12px solid ${title}; pointer-events:none;"></div>
        <div style="position:absolute; top:28px; right:28px; width:40px; height:40px; border-top:3px solid ${primary}; border-right:3px solid ${primary}; pointer-events:none;"></div>
        
        <div style="position:absolute; bottom:10px; left:10px; width:70px; height:70px; border-bottom:12px solid ${title}; border-left:12px solid ${title}; pointer-events:none;"></div>
        <div style="position:absolute; bottom:28px; left:28px; width:40px; height:40px; border-bottom:3px solid ${primary}; border-left:3px solid ${primary}; pointer-events:none;"></div>
        
        <!-- Minor Accent Corners -->
        <div style="position:absolute; top:10px; left:10px; width:30px; height:30px; border-top:2.5px solid ${primary}; border-left:2.5px solid ${primary}; pointer-events:none;"></div>
        <div style="position:absolute; bottom:10px; right:10px; width:30px; height:30px; border-bottom:2.5px solid ${primary}; border-right:2.5px solid ${primary}; pointer-events:none;"></div>
        
        <!-- Thin Inner Frame -->
        <div style="position:absolute; inset:24px; border:1px solid ${primary}50; pointer-events:none;"></div>

        <!-- Gold Medallion Seal -->
        <div style="position:absolute; bottom:24px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; pointer-events:none; z-index:10;">
          <div style="width:46px; height:46px; border-radius:50%; background:radial-gradient(circle at 30% 30%, #ffe875 0%, #d4a853 60%, #a37a1a 100%); border:2px solid #b8860b; box-shadow:0 3px 6px rgba(0,0,0,0.16); display:flex; align-items:center; justify-content:center;">
            <svg style="width:22px; height:22px; fill:#926c12;" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>
        </div>
      `;

    case "curved_wave":
      return `
        <!-- Top Left Curved Wave -->
        <svg style="position:absolute; top:0; left:0; width:180px; height:180px; pointer-events:none; z-index:5;" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,0 L100,0 C70,30 30,70 0,100 Z" fill="${title}" />
          <path d="M0,100 C25,75 75,25 100,0 L104,0 C77,27 27,77 0,104 Z" fill="${primary}" />
        </svg>
        
        <!-- Bottom Right Curved Wave -->
        <svg style="position:absolute; bottom:0; right:0; width:180px; height:180px; pointer-events:none; z-index:5; transform:rotate(180deg);" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,0 L100,0 C70,30 30,70 0,100 Z" fill="${primary}" />
          <path d="M0,100 C25,75 75,25 100,0 L104,0 C77,27 27,77 0,104 Z" fill="${title}" />
        </svg>
        
        <!-- Hanging Gold Ribbon Medal Badge (Top Left) -->
        <div style="position:absolute; top:28px; left:28px; z-index:10; pointer-events:none; display:flex; flex-direction:column; align-items:center;">
          <!-- Ribbon tails -->
          <div style="display:flex; gap:4px; margin-bottom:-10px; transform:rotate(-15deg);">
            <div style="width:7px; height:22px; background-color:${primary}; clip-path:polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%);"></div>
            <div style="width:7px; height:18px; background-color:${title}; clip-path:polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%);"></div>
          </div>
          <!-- Seal -->
          <div style="width:34px; height:34px; border-radius:50%; background:radial-gradient(circle, #ffd700 0%, #b8860b 100%); border:1.5px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.2); display:flex; align-items:center; justify-content:center;">
            <svg style="width:14px; height:14px; fill:#fff;" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
        </div>
      `;

    case "geometric":
      return `
        <!-- Thin Inner Frame -->
        <div style="position:absolute; inset:16px; border:1px solid ${primary}40; pointer-events:none;"></div>
        
        <!-- Top Right Overlapping Triangles -->
        <svg style="position:absolute; top:0; right:0; width:160px; height:160px; pointer-events:none; z-index:5;" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="100,0 100,75 25,0" fill="${title}" opacity="0.9" />
          <polygon points="100,0 100,50 50,0" fill="${primary}" />
          <polygon points="100,0 100,25 75,0" fill="${title}" opacity="0.6" />
          <line x1="25" y1="0" x2="100" y2="75" stroke="${primary}" stroke-width="1.2" />
        </svg>
        
        <!-- Bottom Left Overlapping Triangles -->
        <svg style="position:absolute; bottom:0; left:0; width:160px; height:160px; pointer-events:none; z-index:5; transform:rotate(180deg);" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="100,0 100,75 25,0" fill="${title}" opacity="0.9" />
          <polygon points="100,0 100,50 50,0" fill="${primary}" />
          <polygon points="100,0 100,25 75,0" fill="${title}" opacity="0.6" />
          <line x1="25" y1="0" x2="100" y2="75" stroke="${primary}" stroke-width="1.2" />
        </svg>
      `;

    case "honor_ribbon":
      return `
        <!-- Top Accent Bar -->
        <div style="position:absolute; top:0; left:0; right:0; height:12px; background-color:${title}; pointer-events:none;"></div>
        
        <!-- Vertical Left Ribbon Stripe -->
        <div style="position:absolute; left:36px; top:0; bottom:0; width:22px; background-color:${title}; pointer-events:none; z-index:5; box-shadow: 2px 0 5px rgba(0,0,0,0.15);"></div>
        
        <!-- Premium Gold Medal Seal on Ribbon -->
        <div style="position:absolute; left:27px; top:60px; z-index:10; pointer-events:none; display:flex; flex-direction:column; align-items:center;">
          <div style="width:40px; height:40px; border-radius:50%; background:radial-gradient(circle, #ffd700 0%, #b8860b 100%); border:2px solid ${primary}; box-shadow:0 3px 6px rgba(0,0,0,0.2); display:flex; items-center; justify-content:center; position:relative;">
            <!-- Ribbon tails behind seal -->
            <div style="position:absolute; top:30px; display:flex; gap:3px; z-index:-1;">
              <div style="width:7px; height:22px; background-color:${primary}; clip-path:polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%);"></div>
              <div style="width:7px; height:22px; background-color:${primary}; clip-path:polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%);"></div>
            </div>
            <svg style="width:18px; height:18px; fill:#fff;" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 15l-4-4 1.41-1.41L10 13.17l5.59-5.59L17 9l-7 7z" />
            </svg>
          </div>
        </div>
        
        <!-- Bottom Right Corner Accent Triangle -->
        <svg style="position:absolute; bottom:0; right:0; width:60px; height:60px; pointer-events:none; z-index:5;" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="100,0 100,100 0,100" fill="${primary}" />
        </svg>
      `;

    case "classic":
    default:
      return `
        <div style="position:absolute; inset:12px; border:3px solid ${primary}; border-radius:8px; pointer-events:none;"></div>
        <div style="position:absolute; inset:20px; border:1px solid ${primary}80; border-radius:6px; pointer-events:none;"></div>
      `;
  }
}
