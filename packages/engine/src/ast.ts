export type ASTNode =
  | EmptyNode
  | CommentNode
  | AssignmentNode
  | NumberNode
  | BinaryNode
  | UnaryNode
  | VariableNode
  | CallNode
  | PercentNode
  | PercentOpNode
  | NumberWithUnitNode
  | ConversionNode;

export interface EmptyNode {
  type: "empty";
}

export interface CommentNode {
  type: "comment";
  text: string;
}

export interface AssignmentNode {
  type: "assignment";
  name: string;
  value: ASTNode;
}

export interface NumberNode {
  type: "number";
  value: number;
}

export interface BinaryNode {
  type: "binary";
  op: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryNode {
  type: "unary";
  op: string;
  value: ASTNode;
}

export interface VariableNode {
  type: "variable";
  name: string;
}

export interface CallNode {
  type: "call";
  name: string;
  args: ASTNode[];
}

export interface PercentNode {
  type: "percent";
  value: ASTNode;
}

export interface PercentOpNode {
  type: "percentOp";
  op: "of" | "off" | "on";
  base: ASTNode;
  target: ASTNode;
}

export interface NumberWithUnitNode {
  type: "numberWithUnit";
  value: number;
  unit: string;
}

export interface ConversionNode {
  type: "conversion";
  value: ASTNode;
  targetUnit: string;
}
