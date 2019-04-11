import { set, get } from '@ember/object';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { schedule } from '@ember/runloop';
import Ember from "ember";

const {
  NativeArray
} = Ember;

export default Route.extend({

  setupController(controller) {
    controller.set('mixinStack', []);
    let port = this.get('port');
    port.on('objectInspector:updateObject', this, this.updateObject);
    port.on('objectInspector:updateProperty', this, this.updateProperty);
    port.on('objectInspector:updateErrors', this, this.updateErrors);
    port.on('objectInspector:droppedObject', this, this.droppedObject);
    port.on('deprecation:count', this, this.setDeprecationCount);
    port.on('view:inspectComponent', this, this.inspectComponent);
    port.send('deprecation:getCount');
  },

  deactivate() {
    let port = this.get('port');
    port.off('objectInspector:updateObject', this, this.updateObject);
    port.off('objectInspector:updateProperty', this, this.updateProperty);
    port.off('objectInspector:updateErrors', this, this.updateErrors);
    port.off('objectInspector:droppedObject', this, this.droppedObject);
    port.off('deprecation:count', this, this.setDeprecationCount);
    port.off('view:inspectComponent', this, this.inspectComponent);
  },

  inspectComponent({ viewId }) {
    this.transitionTo('component-tree', {
      queryParams: {
        pinnedObjectId: viewId
      }
    });
  },

  updateObject(options) {
    const details = options.details,
          name = options.name,
          property = options.property,
          objectId = options.objectId,
          errors = options.errors;

    NativeArray.apply(details);
    details.forEach(arrayize);

    let controller = this.get('controller');

    if (options.parentObject) {
      controller.pushMixinDetails(name, property, objectId, details);
    } else {
      controller.activateMixinDetails(name, objectId, details, errors);
    }

    this.send('expandInspector');
  },

  setDeprecationCount(message) {
    this.controller.set('deprecationCount', message.count);
  },

  updateProperty(options) {
    const detail = this.get('controller.mixinDetails.mixins').objectAt(options.mixinIndex);
    const property = get(detail, 'properties').findBy('name', options.property);
    set(property, 'value', options.value);
  },

  updateErrors(options) {
    let mixinDetails = this.get('controller.mixinDetails');
    if (mixinDetails) {
      if (get(mixinDetails, 'objectId') === options.objectId) {
        set(mixinDetails, 'errors', options.errors);
      }
    }
  },

  droppedObject(message) {
    this.get('controller').droppedObject(message.objectId);
  },

  /**
   * Service used to broadcast changes to the application's layout
   * such as toggling of the object inspector.
   *
   * @property layoutService
   * @type {Service}
   */
  layoutService: service('layout'),

  actions: {
    expandInspector() {
      this.set("controller.inspectorExpanded", true);
      // Broadcast that tables have been resized (used by `x-list`).
      schedule('afterRender', () => {
        this.get('layoutService').trigger('resize', { source: 'object-inspector' });
      });
    },
    inspectObject(objectId) {
      if (objectId) {
        this.get('port').send('objectInspector:inspectById', { objectId });
      }
    },
    refreshPage() {
      // If the adapter defined a `reloadTab` method, it means
      // they prefer to handle the reload themselves
      if (typeof this.get('adapter').reloadTab === 'function') {
        this.get('adapter').reloadTab();
      } else {
        // inject ember_debug as quickly as possible in chrome
        // so that promises created on dom ready are caught
        this.get('port').send('general:refresh');
        this.get('adapter').willReload();
      }
    }
  }
});

function arrayize(mixin) {
  NativeArray.apply(mixin.properties);
}
