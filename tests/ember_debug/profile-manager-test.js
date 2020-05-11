import { test } from 'qunit';
import ProfileManager from 'ember-debug/models/profile-manager';

test("Ember Debug - Construction", function(assert) {
  let manager = new ProfileManager();
  assert.ok(!!manager, "it was created");
  assert.equal(manager.profiles.length, 0, "it has no profiles");
});
