//
//  RPHairRibbonPlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

enum RPHairRibbonPlatformAnimationName: String {
    
    case Normal = "RPHairRibbonNormal"
    case JumpingOn = "RPHairRibbonJumpingOn"
    case JumpingOff = "RPHairRibbonJumpingOff"
    case BottomHit = "RPHairRibbonBottomHit"
    
    static let atlasNames = [
        
        Normal.rawValue,
        JumpingOn.rawValue,
        JumpingOff.rawValue,
        BottomHit.rawValue
    ]
}

class RPHairRibbonPlatformEntity: RPPlatformEntity, RPResourceLoadableType {
    
    static var animations: [String: RPAnimation]!
    
    init(isBreakable breakable: Bool, isBottomCollidable bottomCollidable: Bool) {
        
        guard let animations = RPHairRibbonPlatformEntity.animations else {
            fatalError()
        }
        
        super.init(isBreakable: breakable, isBottomCollidable: bottomCollidable, animations: animations)
        
        /* Prototyping */
        
        self.animationComponent.node.size = CGSize(width: 128, height: 76)
        
        let colliderType: RPColliderType = (self.bottomCollidable) ? .BottomCollidablePlatform : .NormalPlatform
        let physicsComponent = RPPhysicsComponent(physicsBody: SKPhysicsBody(rectangleOfSize: CGSize(width: 100, height: 32)), colliderType: colliderType)
        self.addComponent(physicsComponent)
        self.renderComponent.node.physicsBody = physicsComponent.physicsBody
    }
}

extension RPHairRibbonPlatformEntity {
    
    static var resourcesNeedLoading: Bool {
        return true
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        SKTextureAtlas.preloadTextureAtlasesNamed(RPHairRibbonPlatformAnimationName.atlasNames) { error, atlases in
            
            if let error = error { fatalError("Fatal Error beim Preloading der TextureAtlases: \(error)") }
            
            animations = [:]
            
            animations[RPPlatformAnimationName.Normal.rawValue] = RPAnimationComponent.animationsFromAtlas(atlases[0])
            animations[RPPlatformAnimationName.JumpingOn.rawValue] = RPAnimationComponent.animationsFromAtlas(atlases[1])
            animations[RPPlatformAnimationName.JumpingOff.rawValue] = RPAnimationComponent.animationsFromAtlas(atlases[2])
            animations[RPPlatformAnimationName.BottomHit.rawValue] = RPAnimationComponent.animationsFromAtlas(atlases[3])
            
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        animations = nil
    }
    
}
