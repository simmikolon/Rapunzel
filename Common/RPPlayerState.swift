//
//  PlayerState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

protocol PlayerStateDelegate: class {
    
    func playerDidFallDown()
}

class PlayerState: State {
    
    static var allowedStates = [PlayerState:[PlayerState]]()
    var elapsedTime: TimeInterval = 0.0
    
    weak var delegate: PlayerStateDelegate!
    unowned var entity: PlayerEntity
    
    // MARK: Initializers
    
    required init(entity: PlayerEntity, delegate: PlayerStateDelegate) {
        self.entity = entity
        self.delegate = delegate
    }
    
    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        elapsedTime = 0.0
    }
    
    fileprivate func checkIfPlayerIsFallingDown() {
        if self.entity.physicsComponent.physicsBody.velocity.dy < 0 {
            self.entity.stateMachineComponent.stateMachine.enter(PlayerFallingState.self)
        }
    }
    
    fileprivate func checkIfPlayerIsOutOfScreen() {
        if entity.renderComponent.node.position.x <= -GameSceneSettings.width {
            entity.renderComponent.node.position.x = GameSceneSettings.width
        } else if entity.renderComponent.node.position.x >= GameSceneSettings.width {
            entity.renderComponent.node.position.x = -GameSceneSettings.width
        }
    }
    
    #if os(OSX)
    fileprivate func handleKeyboardInput() {
    
        if self.entity.isKeyLeftDown {
        
        entity.physicsComponent.physicsBody.velocity = CGVector(dx: -300.0, dy: entity.physicsComponent.physicsBody.velocity.dy)
        
        } else if self.entity.isKeyRightDown {
        
        entity.physicsComponent.physicsBody.velocity = CGVector(dx: 300.0, dy: entity.physicsComponent.physicsBody.velocity.dy)
        } else {
        
        entity.physicsComponent.physicsBody.velocity = CGVector(dx: 0, dy: entity.physicsComponent.physicsBody.velocity.dy)
        }
    }
    #endif
    
    override func update(deltaTime seconds: TimeInterval) {
        
        super.update(deltaTime: seconds)
        
        checkIfPlayerIsFallingDown()
        checkIfPlayerIsOutOfScreen()
        
        #if os(OSX)
        handleKeyboardInput()
        #endif
        
        elapsedTime += seconds
    }
    
    override func contactWithEntityDidBegin(_ entity: GKEntity) {

        /* Collision Handling for Entities of Platform-Type */

        /* We'll have to find out if the platform is under the princes feet */
        
        if entity is PlatformEntity {
            
            let platformEntity = entity as! PlatformEntity
            
            /* Due to parallaxing we have to convert positions in to absolute screen positions */
            /* If we would take the coordinates without conversion the parallaxing would lead to wrong coordinates */
            /* We could avoid this and skip conversion when putting all active elements on the same parallax layer */
            /* Due to Game Design choises this is currently not the case. So we have to convert! */
            
            let platformPosition = self.entity.renderComponent.node.scene?.convert(platformEntity.renderComponent.node.position,
                from: platformEntity.renderComponent.node.parent!)
            
            var playerPosition = self.entity.renderComponent.node.scene?.convert(self.entity.renderComponent.node.position,
                from: self.entity.renderComponent.node.parent!)
            
            /* Unfortunately the Anchor-Point is not where the players pogo-feet are so we'll have to calculate the offset */
            /* To check for "feet on ground" we have to substract half the size of the texture as an offset */
            
            playerPosition!.y -= self.entity.animationComponent.node.size.height * 0.5
            
            /* Now let's see if the players position is ahead of the platforms position */
            
            if playerPosition!.y > platformPosition!.y {
                
                /* If that's true, it's ok to jump */

                self.stateMachine?.enter(PlayerBouncingDownState.self)
            }
                
            /* In case the player is beyond a platform */
            
            /* Now we have to add size of sprite to the position as an offset to move anchoir point virtually to the head of sprite */
            
            playerPosition!.y += self.entity.animationComponent.node.size.height
            
            /* Now let's see if player is beyond platform */
                
            if playerPosition!.y < platformPosition!.y {
                
                /* And platform is bottomCollidable */

                if platformEntity.bottomCollidable {
                    
                    /* Switch State to bottom collision */

                    self.stateMachine?.enter(PlayerBottomCollisionState.self)
                }
            }
        }
    }
    
    override func contactWithEntityDidEnd(_ entity: GKEntity) {
        
    }
}
