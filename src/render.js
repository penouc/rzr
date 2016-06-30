
import { parse, parseSVG, diff } from './index';

export function render (parent, el, originalPos) {
  var pos = originalPos || 0;
  var oldNode = parent.childNodes[pos];
  var oldEl = oldNode && oldNode.el

  if (typeof el.tagName === 'function') {
    if (oldEl && oldEl.componentClass && el.tagName === oldEl.componentClass) {
      var attrs = el.attrs;
      var children = el.children;
      var oldComponent = oldEl.component;
      var oldComponentClass = oldEl.componentClass;

      oldComponent.update && oldComponent.update(attrs, ...children);

      el = oldComponent.render(attrs, ...children);
      el.component = oldComponent;
      el.componentClass = oldComponentClass;

      return render(parent, el, pos);
    } else {
      var componentClass = el.tagName;
      var component = new componentClass();
      var attrs = el.attrs;
      var children = el.children;

      el = component.render(attrs, ...children);
      el.component = component;
      el.componentClass = componentClass;

      return render(parent, el, pos);
    }
  } else if (el instanceof Array) {
    for (var i = 0; i < el.length; i++) {
      render(parent, el[i], pos++);
    }
  } else if (el instanceof Node) {
    if (oldNode) {
      parent.insertBefore(newNode, oldNode);
    } else {
      parent.appendChild(newNode);
    }
    pos++;
  } else if (typeof el === 'string' || typeof el === 'number') {
    parent.textContent = el;
    pos++;
  } else {
    var isSVG = (el.tagName === 'svg' || parent instanceof SVGElement);

    if (oldEl && el.tagName === oldEl.tagName && el.componentClass === oldEl.componentClass) {
      if (isSVG) {
        diffSVG(parent, oldNode, el);
      } else {
        diff(parent, oldNode, el);
      }
    } else {
      var newNode = isSVG ? parseSVG(el) : parse(el);
      var el = newNode.el;
      var component = el && el.component;

      if (oldNode) {
        parent.insertBefore(newNode, oldNode);
      } else {
        parent.appendChild(newNode);
      }

      if (component) {
        component.dom = newNode;
        component.init && component.init(attrs, ...children);
      }

      if (parent.parentNode) {
        component && component.mount && component.mount();
        notifyDown(newNode, 'mount');
      }
    }
    pos++;
  }

  if (originalPos == null) {
    var traverse = parent.childNodes[pos];

    while (traverse) {
      var next = traverse.nextSibling;
      var el = traverse.el;
      var component = el && el.component;

      component && component.unmount && component.unmount();
      notifyDown(traverse, 'unmount');
      parent.removeChild(traverse);

      traverse = next;
    }
  }
}

function notifyDown (child, eventName) {
  var traverse = child.firstChild;

  while (traverse) {
    var next = traverse.nextSibling;
    var el = traverse.el;
    var component = el && el.component;

    component && component[eventName] && component[eventName]();
    notifyDown(traverse, eventName);

    traverse = next;
  }
}
