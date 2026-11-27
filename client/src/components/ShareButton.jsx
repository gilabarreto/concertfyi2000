import { useEffect, useRef, useState } from "react";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons/faShareNodes";
import { useShare } from "../helpers/share";
import Icon from "./Icon";
import { useT } from "../i18n";

// The SHARE pill of every card. Shares the preview link (helpers/share.js) or, with no share
// sheet, copies it and says so for two seconds.
export default function ShareButton({ url, title, text, imageUrl, label, copiedStatus }) {
  const t = useT();
  const share = useShare(url, title, { text, imageUrl });
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = async () => {
    if (!(await share())) return;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button type="button" onClick={onClick} title={label} className="pill">
        <Icon icon={copied ? faCheck : faShareNodes} className="text-[0.65rem]" />
        {copied ? t("LINK COPIED") : t("SHARE")}
      </button>
      {copiedStatus && (
        <span role="status" className="sr-only">
          {copied ? copiedStatus : ""}
        </span>
      )}
    </>
  );
}
