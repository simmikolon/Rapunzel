//
//  EntityManagerComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class EntityManager: PlatformEntityDelegate, PatternManagerDelegate {
    
    // MARK: - Properties
    
    var entities = [Entity]()
    var entityGarbage = [Entity]()
    
    // MARK: - Component Systems
    
    let componentSystems = [GKComponentSystem(componentClass: RenderComponent.self),
                            GKComponentSystem(componentClass: CameraComponent.self),
                            GKComponentSystem(componentClass: ParallaxScrollingComponent.self),
                            GKComponentSystem(componentClass: AnimationComponent.self),
                            GKComponentSystem(componentClass: StateMachineComponent.self),
                            GKComponentSystem(componentClass: TileComponent.self),
                            GKComponentSystem(componentClass: LifecycleComponent.self),
                            GKComponentSystem(componentClass: InputComponent.self)]
    
    // MARK: - Entity Management
    
    func entity(withName name: String) -> Entity? {
        if let i = entities.indexOf({$0.name == name}) { return entities[i] }
        return nil
    }
    
    func shouldRemoveEntity(entity: Entity) {
        entityGarbage.append(entity)
    }
    
    func addEntity(entity: Entity) {
        entities.append(entity)
        for componentSystem in componentSystems {
            componentSystem.addComponentWithEntity(entity)
        }
    }
    
    func removeEntity(entity: Entity) {
        if let index = entities.indexOf(entity) {
            entities.removeAtIndex(index)
        }
        for componentSystem in componentSystems {
            componentSystem.removeComponentWithEntity(entity)
        }
    }
    
    func flushEntities() {
        for entity in entityGarbage { removeEntity(entity) }
        entityGarbage.removeAll()
    }
    
    func updateComponentSystems(withCurrentTime time: NSTimeInterval) {
        for componentSystem in componentSystems {
            componentSystem.updateWithDeltaTime(time)
        }
    }
    
    // MARK: - Platform Entity Delegate Methods
    
    func didRemovePlatform(platform: PlatformEntity) {
        shouldRemoveEntity(platform)
    }
    
    // MARK: - PatternManagerDelegate
    
    func createBeatElement(beatElement: BeatElement, offset: CGFloat) {
        
        let _ = beatElement.creationHandler(offset: offset, entityManager: self)
    }
}



























/**/
