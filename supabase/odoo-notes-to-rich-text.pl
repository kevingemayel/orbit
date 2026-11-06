use strict;
use warnings;
use JSON::PP;

# Turns the HTML that came out of Odoo's quotation notes into the small subset of
# HTML that Orbit's terms field holds, and writes the migration that stores it.
#
#   perl supabase/odoo-notes-to-rich-text.pl [path to the pulled json]
#       reads  ../odoo-to-orbit/notes-pull/odoo-notes-templates.json by default,
#              which odoo-pull.ps1 wrote from the live Odoo on 10 Oct 2026 and
#              which is not in this repository
#       writes supabase/244-odoo-terms-as-rich-text.sql
#
# Why this exists at all: 219 converted these notes to the plain text a textarea
# holds, and 222 converted them again to keep a table row on one line with " | "
# between the cells. Both were the best that could be done while the terms were
# plain text. They are not any more, so the SAME SOURCE is converted a third and
# last time, into the real thing: headings as headings, the payment schedule as a
# table, the defined terms bold.
#
# The rules here are rtClean's rules in js/app.js, deliberately: the same tags
# kept, the same tags dropped with their contents, every attribute dropped except
# a link's href and a cell's span, Odoo's span and font wrappers unwrapped, its
# invisible characters removed, and the first row of a table with no header cell
# in it read as the header. tests/richtext-import.html proves the agreement:
# it reads the literals straight back out of the migration this writes, runs the
# app's own sanitiser over each one, and requires it back unchanged.

my $HERE = $0; $HERE =~ s{[^/\\]+$}{}; $HERE = "." if $HERE eq "";
my $SRC  = $ARGV[0] || "$HERE/../../odoo-to-orbit/notes-pull/odoo-notes-templates.json";
my $SQL  = "$HERE/244-odoo-terms-as-rich-text.sql";

# ---------------------------------------------------------------------------
# the same lists as js/app.js
my %KEEP = map { $_ => 1 } qw(p br hr strong b em i u s sup sub h2 h3 h4 ul ol li table thead tbody tfoot tr th td a blockquote);
my %DROP = map { $_ => 1 } qw(script style iframe frame frameset object embed applet link meta base head title form input button select option optgroup textarea svg math video audio source track canvas map area img picture noscript template slot dialog colgroup col caption);
my %BLOCKWRAP = map { $_ => 1 } qw(div address);
my %RENAME = (h1 => 'h2', h5 => 'h4', h6 => 'h4', strike => 's', del => 's', ins => 'u');
my %KEEPEMPTY = map { $_ => 1 } qw(table thead tbody tfoot tr th td p);
my %INDENT = map { $_ => 1 } qw(p h2 h3 h4 li);
my %VOID = map { $_ => 1 } qw(br hr img input meta link col source track area base embed param wbr);

sub esc {
  my $s = shift;
  $s = '' unless defined $s;
  $s =~ s/&/&amp;/g; $s =~ s/</&lt;/g; $s =~ s/>/&gt;/g; $s =~ s/"/&quot;/g;
  return $s;
}

# The browser decodes an entity before anything else sees it, so this has to as
# well: without it every one of the 597 &nbsp; in these notes would be escaped a
# second time and print as the five letters "&nbsp;" in the customer's terms.
my %ENT = (
  nbsp => "\x{00A0}", amp => '&', lt => '<', gt => '>', quot => '"', apos => "'",
  lsquo => "\x{2018}", rsquo => "\x{2019}", ldquo => "\x{201C}", rdquo => "\x{201D}",
  ndash => "\x{2013}", mdash => "\x{2014}", hellip => "\x{2026}", bull => "\x{2022}",
  middot => "\x{00B7}", deg => "\x{00B0}", times => "\x{00D7}", frac12 => "\x{00BD}",
  laquo => "\x{00AB}", raquo => "\x{00BB}", euro => "\x{20AC}", pound => "\x{00A3}",
  copy => "\x{00A9}", reg => "\x{00AE}", trade => "\x{2122}",
  ccedil => "\x{00E7}", eacute => "\x{00E9}", egrave => "\x{00E8}", agrave => "\x{00E0}",
  ensp => ' ', emsp => ' ', thinsp => ' ', shy => '', zwnj => '', zwj => '',
);
sub decode_ent {
  my $s = shift;
  $s =~ s/&#x([0-9a-fA-F]+);/chr(hex($1))/ge;
  $s =~ s/&#(\d+);/chr($1)/ge;
  $s =~ s/&([a-zA-Z][a-zA-Z0-9]{1,10});/exists $ENT{$1} ? $ENT{$1} : "&$1;"/ge;
  return $s;
}

# ---- tokenise -------------------------------------------------------------
sub tokens {
  my ($h) = @_;
  my @t;
  while (length $h) {
    if ($h =~ s/^([^<]+)//)                 { push @t, ['text', $1]; next }
    if ($h =~ s/^<!--.*?-->//s)             { next }
    if ($h =~ s/^<!\[CDATA\[.*?\]\]>//s)    { next }
    if ($h =~ s/^<![^>]*>//s)               { next }
    if ($h =~ s/^<\?[^>]*>//s)              { next }
    if ($h =~ s{^</\s*([a-zA-Z][-a-zA-Z0-9:]*)[^>]*>}{}) { push @t, ['end', lc $1]; next }
    if ($h =~ s{^<\s*([a-zA-Z][-a-zA-Z0-9:]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>}{}) {
      my ($n, $a) = (lc $1, $2);
      my $self = ($a =~ m{/\s*$}) ? 1 : 0;
      push @t, ['start', $n, $a, $self];
      next;
    }
    $h =~ s/^<//;
    push @t, ['text', '<'];                 # a stray angle bracket is a character
  }
  return \@t;
}

# ---- tree -----------------------------------------------------------------
# Mismatched end tags close whatever is open up to them, the way a browser does,
# and an end tag with nothing open to match is ignored.
sub tree {
  my ($toks) = @_;
  my $root = { n => '#root', kids => [] };
  my @stack = ($root);
  for my $t (@$toks) {
    if ($t->[0] eq 'text') { push @{ $stack[-1]{kids} }, { n => '#text', v => $t->[1] }; next }
    if ($t->[0] eq 'start') {
      my ($n, $a, $self) = ($t->[1], $t->[2], $t->[3]);
      my $node = { n => $n, a => $a, kids => [] };
      push @{ $stack[-1]{kids} }, $node;
      push @stack, $node unless $self || $VOID{$n};
      next;
    }
    my $n = $t->[1];
    next if $VOID{$n};
    my $at = -1;
    for (my $i = $#stack; $i >= 1; $i--) { if ($stack[$i]{n} eq $n) { $at = $i; last } }
    next if $at < 0;
    splice @stack, $at;
  }
  return $root;
}

# ---- serialise, by rtClean's rules ----------------------------------------
my ($HEADROW, $ASHEAD);

sub attr {
  my ($a, $name) = @_;
  return undef unless defined $a;
  return $1 if $a =~ /\b\Q$name\E\s*=\s*"([^"]*)"/i;
  return $1 if $a =~ /\b\Q$name\E\s*=\s*'([^']*)'/i;
  return $1 if $a =~ /\b\Q$name\E\s*=\s*([^\s>]+)/i;
  return undef;
}
sub first_tr {
  my ($node) = @_;
  for my $k (@{ $node->{kids} || [] }) {
    next if $k->{n} eq '#text';
    return $k if $k->{n} eq 'tr';
    my $d = first_tr($k);
    return $d if $d;
  }
  return undef;
}
sub has_th {
  my ($node) = @_;
  for my $k (@{ $node->{kids} || [] }) {
    next if $k->{n} eq '#text';
    return 1 if $k->{n} eq 'th';
    return 1 if has_th($k);
  }
  return 0;
}
sub kids_html {
  my ($node) = @_;
  my $o = '';
  # the newlines and spaces Odoo's editor left between a table's rows are layout,
  # not text, and they are the one thing a browser and this script would disagree
  # about if they were kept
  my $struct = ($node->{n} =~ /^(?:table|thead|tbody|tfoot|tr)$/) ? 1 : 0;
  for my $k (@{ $node->{kids} || [] }) {
    next if $struct && $k->{n} eq '#text' && $k->{v} !~ /\S/;
    $o .= one_html($k);
  }
  return $o;
}
# Odoo writes an indented sub-clause as a forty-pixel tab span, and the plain text
# these notes passed through on the way here kept it as a leading tab. Either way
# it is an indent, and an indent is the only thing a class is allowed to say: the
# value is one of three, written here, never carried over from the document.
sub indent_of {
  my ($node, $inner) = @_;
  my $lv = 0;
  my $cls = attr($node->{a}, 'class');
  $lv = $1 if defined $cls && $cls =~ /\brt-in([1-3])\b/;
  if ($inner =~ /^(\t{1,3})/) { my $t = length $1; $lv = $t if $t > $lv }
  return $lv;
}
sub blk {
  my ($tag, $inner, $lv, $at) = @_;
  $at = '' unless defined $at;
  $at .= ' class="rt-in' . $lv . '"' if $lv;
  return "<$tag$at>$inner</$tag>";
}
sub one_html {
  my ($node) = @_;
  if ($node->{n} eq '#text') {
    my $v = decode_ent($node->{v});
    $v =~ s/[\x{200B}-\x{200D}\x{2060}\x{FEFF}]//g;
    return esc($v);
  }
  my $tag = $node->{n};
  return '' if $DROP{$tag};
  $tag = $RENAME{$tag} if $RENAME{$tag};
  unless ($KEEP{$tag}) {
    my $inner = kids_html($node);
    if ($BLOCKWRAP{$tag} && $inner =~ /\S/ && $inner !~ /<(?:p|h[2-4]|ul|ol|li|table|tr|blockquote|hr)[\s>]/i) {
      my $dlv = indent_of($node, $inner);
      $inner =~ s/^\t+//;
      return blk('p', $inner, $dlv);
    }
    return $inner;
  }
  return "<$tag>" if $tag eq 'br' || $tag eq 'hr';
  if ($tag eq 'table') {
    my $prev = $HEADROW;
    $HEADROW = has_th($node) ? undef : first_tr($node);
    my $body = kids_html($node);
    $HEADROW = $prev;
    return '' if index($body, '<tr') < 0;
    return "<table>$body</table>";
  }
  if ($tag eq 'tr') {
    my $prev = $ASHEAD;
    $ASHEAD = (defined $HEADROW && $HEADROW == $node) ? 1 : 0;
    my $cells = kids_html($node);
    $ASHEAD = $prev;
    return "<tr>$cells</tr>";
  }
  $tag = 'th' if $tag eq 'td' && $ASHEAD;
  my $at = '';
  if ($tag eq 'a') {
    my $href = attr($node->{a}, 'href');
    $href = '' unless defined $href;
    $href =~ s/[\x00-\x20]//g;
    return kids_html($node) unless $href =~ m{^(?:https?://|mailto:)}i;
    $at = ' href="' . esc($href) . '" target="_blank" rel="noopener noreferrer"';
  }
  if ($tag eq 'th' || $tag eq 'td') {
    for my $pair (['colspan', 40], ['rowspan', 200]) {
      my $v = attr($node->{a}, $pair->[0]);
      next unless defined $v && $v =~ /^\s*(\d+)/;
      my $k = $1 + 0;
      $at .= ' ' . $pair->[0] . '="' . $k . '"' if $k > 1 && $k < $pair->[1];
    }
  }
  my $in = kids_html($node);
  my $lv = 0;
  if ($INDENT{$tag}) { $lv = indent_of($node, $in); $in =~ s/^\t+// }
  unless ($KEEPEMPTY{$tag}) {
    my $bare = $in;
    $bare =~ s/<br>//g;
    $bare =~ s/[\s\x{00A0}]+//g;
    return '' if $bare eq '';
  }
  return blk($tag, $in, $lv, $at);
}

sub convert {
  my ($html) = @_;
  return '' unless defined $html && $html =~ /\S/;
  ($HEADROW, $ASHEAD) = (undef, 0);
  my $out = kids_html(tree(tokens($html)));
  $out =~ s/(?:<br>\s*)+$//;
  $out =~ s/^\s+//; $out =~ s/\s+$//;
  return $out;
}

# ---------------------------------------------------------------------------
open my $fh, '<:raw', $SRC or die "open $SRC: $!";
my $json = decode_json(do { local $/; <$fh> });
close $fh;

sub q_sql { my $s = shift; $s =~ s/'/''/g; return "'" . $s . "'" }

my (@chunks, $kept, $skipped);
$kept = 0; $skipped = 0;

# ---- the four quotation templates: the master copy of the terms -----------
for my $t (@{ $json->{templates} || [] }) {
  my $html = convert($t->{note});
  next unless $html;
  push @chunks, "-- template: " . $t->{name} . "\n"
    . "update public.quote_templates set note = " . q_sql($html) . "\n"
    . " where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')\n"
    . "   and name = " . q_sql($t->{name}) . ";\n";
  $kept++;
}

# ---- the quotations and sales orders --------------------------------------
for my $o (@{ $json->{orderNotes} || [] }) {
  my $num = $o->{name} || '';
  unless ($num =~ /^S\d{5}$/) { $skipped++; next }
  my $html = convert($o->{note});
  next unless $html;
  push @chunks, "-- " . $num . "\n"
    . "update public.sale_orders set narration = " . q_sql($html) . "\n"
    . " where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')\n"
    . "   and number = " . q_sql($num) . ";\n";
  $kept++;
}

# ---- the invoices and the credit note ------------------------------------
for my $i (@{ $json->{invoiceNarration} || [] }) {
  my $num = $i->{name} || '';
  # Odoo holds two unnumbered drafts, which 210 deliberately did not import, so
  # there is nothing here for them to land on.
  unless ($num =~ m{^R?INV/\d{4}/\d+$}) { $skipped++; next }
  my $html = convert($i->{narration});
  next unless $html;
  push @chunks, "-- " . $num . "\n"
    . "update public.invoices set narration = " . q_sql($html) . "\n"
    . " where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')\n"
    . "   and number = " . q_sql($num) . ";\n";
  $kept++;
}

# ---- write the migration --------------------------------------------------
my $head = <<'SQL';
-- 244: the terms read the way they were written.
--
-- Kevin: "i didnt like how the quotation notes from francois rendered in odoo
-- they used to be rich text and there was a table also that lost its format".
-- He is right, and twice over. Odoo held these notes as HTML. 219 brought them
-- in as the plain text a textarea holds, so every heading lost its weight and
-- every cell of the payment schedule landed on its own line. 222 converted the
-- same source again so a row stayed on one line with " | " between the cells,
-- which the printed page could read back as a table; the form and the emailed
-- copy still showed the pipes.
--
-- The terms are rich text now, so the SAME SOURCE is converted a third and last
-- time, into the real thing: headings as headings, the schedule as a table, the
-- defined terms bold. Nothing is summarised, cut or reworded. What the customer
-- read in Odoo is what prints out of Orbit.
--
-- Written by supabase/odoo-notes-to-rich-text.pl from
-- odoo-to-orbit/notes-pull/odoo-notes-templates.json, pulled live on 10 Oct 2026.
-- That script follows rtClean's rules in js/app.js tag for tag, and
-- tests/richtext-import.html proves it: it runs the app's own sanitiser
-- over every string below and requires it back unchanged.
--
-- Two unnumbered Odoo drafts are skipped, because 210 deliberately did not import
-- them and there is nothing for them to land on. INV/2026/00002 is written below
-- and matches no row either: the notes were pulled on 10 Oct 2026, two months
-- after the 10 Aug export that 210 was built from, and that invoice was raised in
-- Odoo in between. Its terms were one line, a link to spacework.ai/terms. Run of
-- 6 Nov 2026: 4 templates, 14 sales orders and 8 invoices updated, none left
-- holding plain text.
--
-- Chunked because the Management API answers 400 with an EMPTY body to a
-- statement this long, which looks exactly like a SQL error and is not one.
SQL
$head =~ s/\s+$//;

my $sql = $head . "\n";
for my $c (@chunks) { $sql .= "\n-- \@chunk\n\n" . $c }
$sql .= "\n-- \@chunk\n\n"
  . "-- what landed, and whether anything is still plain text\n"
  . "select 'quote_templates' as what,\n"
  . "       count(*) filter (where note like '<%') as rich,\n"
  . "       count(*) filter (where note is not null and note not like '<%') as still_plain,\n"
  . "       count(*) filter (where note like '%<table>%') as with_a_table\n"
  . "  from public.quote_templates\n"
  . " where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')\n"
  . "union all\n"
  . "select 'sale_orders',\n"
  . "       count(*) filter (where narration like '<%'),\n"
  . "       count(*) filter (where narration is not null and narration not like '<%'),\n"
  . "       count(*) filter (where narration like '%<table>%')\n"
  . "  from public.sale_orders\n"
  . " where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')\n"
  . "union all\n"
  . "select 'invoices',\n"
  . "       count(*) filter (where narration like '<%'),\n"
  . "       count(*) filter (where narration is not null and narration not like '<%'),\n"
  . "       count(*) filter (where narration like '%<table>%')\n"
  . "  from public.invoices\n"
  . " where company_id = (select id from public.companies where name = 'Space Work S.A.R.L');\n";

open my $out, '>:raw:encoding(UTF-8)', $SQL or die "write $SQL: $!";
print $out $sql;
close $out;

printf "%d documents converted, %d skipped (never imported), %.0f KB of SQL\n",
  $kept, $skipped, length($sql) / 1024;
printf "  %s\n", $SQL;
