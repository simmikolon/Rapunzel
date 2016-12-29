//
//  HairRibbonPlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

enum HairRibbonPlatformAnimationName: String {
    
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

class HairRibbonPlatformEntity: PlatformEntity, ResourceLoadableType {
    
    static var animations: [String: Animation]!
    
    init(isBreakable breakable: Bool, isBottomCollidable bottomCollidable: Bool) {
        
        guard let animations = HairRibbonPlatformEntity.animations else {
            fatalError()
        }
        
        super.init(isBreakable: breakable, isBottomCollidable: bottomCollidable, animations: animations)
        
        /* Prototyping */
        
        self.animationComponent.node.size = CGSize(width: 128, height: 76)
        
        let colliderType: ColliderType = (self.bottomCollidable) ? .BottomCollidablePlatform : .NormalPlatform
        let physicsComponent = PhysicsComponent(physicsBody: SKPhysicsBody(rectangleOf: CGSize(width: 100, height: 32)), colliderType: colliderType)
        self.addComponent(physicsComponent)
        self.renderComponent.node.physicsBody = physicsComponent.physicsBody
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

extension HairRibbonPlatformEntity {
    
    static var resourcesNeedLoading: Bool {
        return animations == nil
    }
    
    static func loadResources(withCompletionHandler completionHandler: @escaping () -> ()) {
        
        SKTextureAtlas.preloadTextureAtlasesNamed(HairRibbonPlatformAnimationName.atlasNames) { error, atlases in
            
            if let error = error { fatalError("Fatal Error beim Preloading der TextureAtlases: \(error)") }
            
            animations = [:]
            
            animations[PlatformAnimationName.Normal.rawValue] = AnimationComponent.animationsFromAtlas(atlases[0])
            animations[PlatformAnimationName.JumpingOn.rawValue] = AnimationComponent.animationsFromAtlas(atlases[1])
            animations[PlatformAnimationName.JumpingOff.rawValue] = AnimationComponent.animationsFromAtlas(atlases[2])
            animations[PlatformAnimationName.BottomHit.rawValue] = AnimationComponent.animationsFromAtlas(atlases[3])
            
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        animations = nil
    }
    
}
