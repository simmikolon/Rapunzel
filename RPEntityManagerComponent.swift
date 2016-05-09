//
//  RPEntityManagerComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPEntityManagerComponent: GKComponent, RPPlatformEntityDelegate {
    
    // MARK: - Properties
    
    var entities = [RPEntity]()
    var entityGarbage = [RPEntity]()
    
    // MARK: - Component Systems
    
    let componentSystems = [GKComponentSystem(componentClass: RPRenderComponent.self),
                            GKComponentSystem(componentClass: RPCameraComponent.self),
                            GKComponentSystem(componentClass: RPParallaxScrollingComponent.self),
                            GKComponentSystem(componentClass: RPAnimationComponent.self),
                            GKComponentSystem(componentClass: RPStateMachineComponent.self),
                            GKComponentSystem(componentClass: RPTileComponent.self),
                            GKComponentSystem(componentClass: RPLifecycleComponent.self),
                            GKComponentSystem(componentClass: RPPatternControllerComponent.self),
                            GKComponentSystem(componentClass: RPInputComponent.self),
                            GKComponentSystem(componentClass: RPEntityManagerComponent.self)]
    
    // MARK: - Entity Management
    
    func entity(withName name: String) -> RPEntity? {
        if let i = entities.indexOf({$0.name == name}) { return entities[i] }
        return nil
    }
    
    func shouldRemoveEntity(entity: RPEntity) {
        entityGarbage.append(entity)
    }
    
    func addEntity(entity: RPEntity) {
        entities.append(entity)
        for componentSystem in componentSystems {
            componentSystem.addComponentWithEntity(entity)
        }
    }
    
    func removeEntity(entity: RPEntity) {
        if let index = entities.indexOf(entity) {
            entities.removeAtIndex(index)
        }
        for componentSystem in componentSystems {
            componentSystem.removeComponentWithEntity(entity)
        }
    }
    
    private func flushEntities() {
        for entity in entityGarbage { removeEntity(entity) }
        entityGarbage.removeAll()
    }
    
    // MARK: - Lifecycle
    
    private func updateComponentSystems(withCurrentTime time: NSTimeInterval) {
        for componentSystem in componentSystems {
            componentSystem.updateWithDeltaTime(time)
        }
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        /* Forward update into Component Systems */
        
        updateComponentSystems(withCurrentTime: seconds)
        
        /* Releasing of unused entities is done after enumeration over component systems */
        
        flushEntities()
    }
    
    // MARK: - Platform Entity Delegate Methods
    
    func didRemovePlatform(platform: RPPlatformEntity) {
        shouldRemoveEntity(platform)
    }
}
